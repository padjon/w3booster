import { Express } from 'express';
import { randomBytes } from 'crypto';
import { BaseAPI } from './base/base.api';
import { ServiceManager, PaypalService, StripeService, Parse } from 'app/data/services';
import { ShopItemService } from 'app/data/modelservices';
import { User } from 'app/data/models';
import { ShopOrderCloud } from './parse/cloud/functions/shop-order.cloud';

const ITEM_BY_DAYS = new Map<number, string>([
    [30, 'BHNy4cogfY'],
    [60, 'W8aFnVoaPw'],
    [90, 'TF9RMK7g4O']
]);

export class GiftAPI extends BaseAPI {
    private shopItemService = ServiceManager.get(ShopItemService);
    private paypalService = ServiceManager.get(PaypalService);
    private stripeService = ServiceManager.get(StripeService);

    constructor(app: Express) {
        super(app);

        this.getRouter().get('/lookup/:handle', (req, res) => {
            (async () => {
                const recipient = await this.findRecipient(req.params.handle);
                if (!recipient) {
                    res.sendStatus(404);
                    return;
                }
                res.send(this.toGiftRecipient(recipient, req.params.handle));
            })().catch((e: any) => {
                res.status(500).send({ message: e?.message ?? String(e) });
            });
        });

        this.getRouter().post('/paypal', (req, res) => {
            (async () => {
                const recipient = await this.requireRecipient(req.body?.handle);
                const state = this.createState('gift-paypal');
                const approvalUrl = await ShopOrderCloud.createGiftPayPalOrderCore(
                    this.shopItemService,
                    this.paypalService,
                    recipient,
                    this.resolveItemId(req.body),
                    state,
                    this.getGiftDetails(req.body, 'paypal'),
                    req.body?.returnTo
                );
                res.send({ approvalUrl, state, recipient: this.toGiftRecipient(recipient, req.body?.handle) });
            })().catch((e: any) => {
                res.status(400).send({ message: e?.message ?? String(e) });
            });
        });

        this.getRouter().post('/stripe', (req, res) => {
            (async () => {
                const recipient = await this.requireRecipient(req.body?.handle);
                const state = this.createState('gift-stripe');
                const checkoutUrl = await ShopOrderCloud.createGiftStripeCheckoutCore(
                    this.shopItemService,
                    this.stripeService,
                    recipient,
                    this.resolveItemId(req.body),
                    state,
                    this.getGiftDetails(req.body, 'stripe'),
                    req.body?.returnTo
                );
                res.send({ checkoutUrl, state, recipient: this.toGiftRecipient(recipient, req.body?.handle) });
            })().catch((e: any) => {
                res.status(400).send({ message: e?.message ?? String(e) });
            });
        });
    }

    private async requireRecipient(handle: string): Promise<User> {
        const recipient = await this.findRecipient(handle);
        if (!recipient) {
            throw new Error('No W3Booster account has connected this Twitch handle yet.');
        }
        return recipient;
    }

    private async findRecipient(handle: string): Promise<User> {
        const normalized = this.normalizeHandle(handle);
        if (!normalized) {
            return null;
        }

        const query = new Parse.Query(User);
        query.equalTo('connectedTwitchLogins', normalized);
        query.include('playerOverlaySettings');
        query.include('obsOverlaySettings');
        return query.first({ useMasterKey: true }) as Promise<User>;
    }

    private resolveItemId(body: any) {
        if (body?.itemId) {
            return String(body.itemId);
        }
        const days = Number(body?.duration || body?.days || 30);
        return ITEM_BY_DAYS.get(days) || ITEM_BY_DAYS.get(30);
    }

    private getGiftDetails(body: any, provider: 'paypal' | 'stripe') {
        return {
            recipientHandle: this.normalizeHandle(body?.handle),
            senderName: body?.senderName,
            message: body?.message,
            provider
        };
    }

    private toGiftRecipient(user: User, requestedHandle: string) {
        const normalized = this.normalizeHandle(requestedHandle);
        const twitchAccount = (user.connectedAccounts || []).find(account =>
            account.provider === 'twitch' && String(account.login).toLowerCase() === normalized
        );
        return {
            id: user.id,
            handle: twitchAccount?.login || normalized,
            displayName: twitchAccount?.displayName || user.displayName,
            avatarUrl: twitchAccount?.avatarUrl,
            isPro: user.isProPlan(),
            planUntil: user.planUntil?.toISOString?.()
        };
    }

    private normalizeHandle(handle: string) {
        return String(handle || '').replace(/^@/, '').trim().toLowerCase();
    }

    private createState(prefix: string) {
        return prefix + '-' + randomBytes(16).toString('hex');
    }
}
