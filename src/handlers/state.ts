import { Env, UserRow } from '../types';

export class DBManager {
	constructor(private db: D1Database) {}

	async getUser(userId: number): Promise<UserRow | null> {
		return await this.db.prepare('SELECT * FROM users WHERE id = ?').bind(userId).first<UserRow>();
	}

	async createUser(userId: number, firstName: string, username?: string, referredBy?: number) {
		await this.db
			.prepare('INSERT OR IGNORE INTO users (id, first_name, username, referred_by) VALUES (?, ?, ?, ?)')
			.bind(userId, firstName, username || null, referredBy || null)
			.run();
	}

	async updateState(userId: number, state: string) {
		await this.db.prepare('UPDATE users SET state = ? WHERE id = ?').bind(state, userId).run();
	}

	async saveWalletAndReward(userId: number, wallet: string, bonusAmount: number) {
		// Update wallet, add bonus if balance is 0 (first time), and reset state
		await this.db
			.prepare(`UPDATE users SET wallet_address = ?, state = 'idle', balance = balance + CASE WHEN balance = 0 THEN ? ELSE 0 END WHERE id = ?`)
			.bind(wallet, bonusAmount, userId)
			.run();
	}

	async addReferralBonus(referrerId: number, amount: number) {
		await this.db.prepare('UPDATE users SET balance = balance + ? WHERE id = ?').bind(amount, referrerId).run();
	}

	async getReferralCount(userId: number): Promise<number> {
		const result = await this.db.prepare('SELECT COUNT(*) as count FROM users WHERE referred_by = ?').bind(userId).first<{ count: number }>();
		return result?.count || 0;
	}
}
