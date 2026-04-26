import * as paypal from 'paypal-rest-sdk';
import { ShopItem, User } from 'app/data/models';
import { appConfig } from 'app/config';

export class PaypalService {

    constructor() {
        if (appConfig.isDevMode ) {
            console.log('Paypal Service Sandbox MODE');
            paypal.configure({
                'mode': 'sandbox',
                'client_id': 'Abf15zZywo60i-8qlqyMbfWO3zi1KNLFwzALL_sCDqLNVvEsu119cejk4Xc3PrJQCtu89vcgfAXuw6KR',
                'client_secret': 'EHPCyNrN0Lg8BKj6g_fe9GhKBYNfHKhOduKcJ82dFH40eqS44fTe4WTXmK9IdIkwh2ZBhIooustizxdy'
            });
        } else {
            console.log('Paypal Service LIVE MODE');
            paypal.configure({
                'mode': 'live',
                'client_id': 'AeH791B7jjKLCGTZctV5Ivt0QH4-tp9ztndrKJ9F3z_XcqHwsurUAQlOuAqbSXqeWYcY3bXqRJ5jo6Uf',
                'client_secret': 'EPm1zDwtD8JbYpDXSf0Mo8maeB8EUxd2nCCNWIr5E-moq1as0UMjYBVJEqUXgLmMcsmaQEBxQRu9pi7S'

            });
        }
    }

    public getPaymentState(paymentId: string): void {
        console.log(paypal.payment.get('PAYID-LXUU4PY10A42442L64722306', (error, payment) => {
            console.log(payment);
        }));
    }

    public executePayment(paymentId: string, payerId: string): Promise<any> {
        return new Promise((res, rej) => {
            paypal.payment.execute(paymentId,  { 'payer_id': payerId }, (error, payment) => {
                if (error) {
                    console.warn(error);
                    rej(error);
                } else {
                    res(payment);
                }
            });
        });
    }


    public createPayment(user: User, item: ShopItem, returnUrlOverride?: string, cancelUrlOverride?: string): Promise<any> {
        const defaultReturnUrl = (appConfig.isDevMode) ? 'http://localhost:4200/' : 'https://app.w3booster.com/public/client/';
        const returnUrl = returnUrlOverride ?? defaultReturnUrl;
        const cancelUrl = cancelUrlOverride ?? returnUrl;
        const create_payment_json = {
            'intent': 'sale',
            'application_context': {
                'brand_name': 'W3Booster',
                'shipping_preference': 'NO_SHIPPING'
            },
            'payer': {
                'payment_method': 'paypal'
            },
            'redirect_urls': {
                'return_url': returnUrl,
                'cancel_url': cancelUrl
            },
            'transactions': [{
                'amount': {
                    'total': item.price,
                    'currency': 'EUR',
                    details: {
                        subtotal: item.price
                    }
                },
                'item_list': {
                    'items': [
                        {
                            'name': item.description,
                            'quantity': '1',
                            'price': item.price,
                            'sku': item.id,
                            'currency': 'EUR'
                        },
                    ]
                },
                'custom': user.id
            }]
        };

        return new Promise((res, rej) => {
            paypal.payment.create(create_payment_json, function (error, payment) {
                if (error) {
                    rej(error);
                } else {
                    res(payment);
                }
            });
        });
    }
}
