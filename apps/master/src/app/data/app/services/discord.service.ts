import Discord, { GatewayIntentBits, Guild, GuildMember, Role, User } from 'discord.js';
import DiscordOauthClient from 'discord-oauth2';
import { DiscordUserData } from 'app/data/models';

export class DiscordService {

    private oauthClient = new DiscordOauthClient();
    private client = new Discord.Client({ intents: [GatewayIntentBits.Guilds] });
    private guild: Guild;
    private proRole: Role;
    private defaultRole: Role;

    constructor() {
        this.client.on('error', (e) => {
            console.warn(e);
        })
        this.client.on('ready', () => {
            this.guild = (this.client.guilds.cache as any).find(guild => guild.name === 'W3Booster') as Guild;
            this.proRole = (this.guild.roles.cache as any).find(ch => ch.name === 'PRO');
            this.defaultRole = (this.guild.roles.cache as any).find(ch => ch.name === 'Connected in W3Booster App');
        });

        if (process.env.DISCORD_BOT_TOKEN) {
            (async () => {
                try {
                    await this.client.login(process.env.DISCORD_BOT_TOKEN);
                } catch(err) {
                    console.error("Unable to login to discord! (" + err.message + ")")
                }
            })()
        }
        
    }

    public getUserDataByCode(code: string): Promise<DiscordUserData> {
        return new Promise((res, rej) => {
            this.oauthClient.tokenRequest({
                clientId: process.env.DISCORD_CLIENT_ID || '821393908172324945',
                clientSecret: process.env.DISCORD_CLIENT_SECRET || '',
                code: code,
                scope: 'identify',
                grantType: 'authorization_code',
                redirectUri: 'http://w3booster.com/discord-connect',
            }).then((response) => {
                this.oauthClient.getUser(response.access_token).then(user => {
                    res({
                        id: user.id,
                        username: user.username + '#' + user.discriminator
                    });
                }).catch(rej);
            }).catch(rej);
        });
    }

    public addProRole(userData: DiscordUserData) {
        this.guild.members.fetch(userData.id).then((guildMember => {
            if (guildMember) {
                (guildMember.roles as any).add(this.proRole);
            }
        }));
    }

    public removeProRole(userData: DiscordUserData) {
        this.guild.members.fetch(userData.id).then((guildMember => {
            if (guildMember) {
                (guildMember.roles as any).remove(this.proRole);
            }
        }));
    }

    public addDefaultRole(userData: DiscordUserData) {
        this.guild.members.fetch(userData.id).then((guildMember => {
            if (guildMember) {
                (guildMember.roles as any).add(this.defaultRole);
            }
        }));
    }

    public removeDefaultRole(userData: DiscordUserData) {
        this.guild.members.fetch(userData.id).then((guildMember => {
            if (guildMember) {
                (guildMember.roles as any).remove(this.defaultRole);
            }
        }));
    }
}
