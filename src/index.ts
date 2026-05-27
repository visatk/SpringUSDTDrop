import { Bot, webhookCallback } from 'grammy';
import { Env, MyContext } from './types';
import { setupUserHandlers } from './handlers/user';

export default {
	async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
		try {
			// Ensure BOT_TOKEN exists in environment variables
			if (!env.BOT_TOKEN) {
				return new Response('Bot token not configured', { status: 500 });
			}

			const bot = new Bot<MyContext>(env.BOT_TOKEN);

			// Middleware to inject Cloudflare Env into Grammy Context
			bot.use(async (ctx, next) => {
				ctx.env = env;
				await next();
			});

			// Setup Handlers
			setupUserHandlers(bot);

			// Handle Webhook via Grammy's built-in adapter for Cloudflare
			return webhookCallback(bot, 'cloudflare-mod')(request);

		} catch (error: any) {
			console.error('Worker error:', error.message);
			return new Response('Internal Server Error', { status: 500 });
		}
	},
};
