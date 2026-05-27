import { Env, UserRow, WithdrawalRow } from '../types';

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

	async updateState(userId: number, state: string, tempData: string | null = null) {
		await this.db.prepare('UPDATE users SET state = ?, temp_data = ? WHERE id = ?').bind(state, tempData, userId).run();
	}

	async saveWalletAndReward(userId: number, wallet: string, bonusAmount: number) {
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

	async createWithdrawal(userId: number, amount: number, txHash: string): Promise<number> {
		const batch = await this.db.batch([
            this.db.prepare('INSERT INTO withdrawals (user_id, amount, tx_hash) VALUES (?, ?, ?) RETURNING id').bind(userId, amount, txHash),
            this.db.prepare('UPDATE users SET balance = balance - ? WHERE id = ?').bind(amount, userId)
        ]);
        const result = batch[0].results[0] as { id: number };
        return result.id;
	}

	async getWithdrawal(id: number): Promise<WithdrawalRow | null> {
		return await this.db.prepare('SELECT * FROM withdrawals WHERE id = ?').bind(id).first<WithdrawalRow>();
	}

	async updateWithdrawalStatus(id: number, status: string) {
		await this.db.prepare('UPDATE withdrawals SET status = ? WHERE id = ?').bind(status, id).run();
	}

	async refundBalance(userId: number, amount: number) {
		await this.db.prepare('UPDATE users SET balance = balance + ? WHERE id = ?').bind(amount, userId).run();
	}

	async getStats() {
		const users = await this.db.prepare('SELECT COUNT(*) as c FROM users').first<{c:number}>();
		const balance = await this.db.prepare('SELECT SUM(balance) as s FROM users').first<{s:number}>();
		const withdrawals = await this.db.prepare('SELECT COUNT(*) as c FROM withdrawals WHERE status = "approved"').first<{c:number}>();
		return { totalUsers: users?.c || 0, totalBalance: balance?.s || 0, approvedWithdrawals: withdrawals?.c || 0 };
	}

	async getAllUserIds(): Promise<number[]> {
		const result = await this.db.prepare('SELECT id FROM users').all<{ id: number }>();
		return result.results.map(r => r.id);
	}
}
