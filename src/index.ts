import { Bot, webhookCallback } from 'grammy';
import { Env, MyContext } from './types';
import { setupUserHandlers } from './handlers/user';
import { setupAdminHandlers } from './handlers/admin';

export default {
	async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
		try {
			if (!env.BOT_TOKEN) return new Response('Bot token not configured', { status: 500 });

			const bot = new Bot<MyContext>(env.BOT_TOKEN);

			// Inject Cloudflare Env & Execution Context safely
			bot.use(async (botCtx, next) => {
				botCtx.env = env;
				botCtx.executionCtx = ctx; 
				await next();
			});

			// Setup Handlers (Admin MUST be registered before User for message falling-through)
			setupAdminHandlers(bot);
			setupUserHandlers(bot);

			return webhookCallback(bot, 'cloudflare-mod')(request);
		} catch (error: any) {
			console.error('Worker error:', error.message);
			return new Response('Internal Server Error', { status: 500 });
		}
	},
};
