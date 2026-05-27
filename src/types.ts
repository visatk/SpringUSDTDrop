import { Context } from 'grammy';

export interface Env {
	DB: D1Database;
	BOT_TOKEN: string;
	ADMIN_ID: string;
}

export interface MyContext extends Context {
	env: Env;
}

export interface UserRow {
	id: number;
	username: string | null;
	first_name: string;
	wallet_address: string | null;
	balance: number;
	referred_by: number | null;
	state: string;
	temp_data: string | null;
}

export interface WithdrawalRow {
	id: number;
	user_id: number;
	amount: number;
	tx_hash: string;
	status: string;
}
