import type { EndpointOutput, Request } from '@sveltejs/kit';
import * as dotenv from 'dotenv';
import { definitions } from '@inlang/database';
import { createServerSideSupabaseClient } from '../_utils/serverSideServices';

// this type is only exportable to be consumed in the front-end.
//* DO NOT import this type outside of the dashboard.
export type CreateMemberRequestBody= {
	organizationId: definitions['organization']['id'];
    memberEmail: definitions['user']['email'];
    adminId: definitions['user']['id'];
    role: "ADMIN"|"TRANSLATOR";
};

export type GetUserIdRequestBody = {
    organizationId: definitions['organization']['id'];
    memberEmail: definitions['user']['email'];
    role: "ADMIN"|"TRANSLATOR";
}

export type GetUserIdResponseBody = {
    userId: definitions['user']['id'];
}

export async function post(request: Request): Promise<EndpointOutput> {
    dotenv.config()

    if (request.headers['content-type'] !== 'application/json') {
		return {
			status: 405
		};
	}

    try {
        const requestBody = (request.body as unknown) as GetUserIdRequestBody;
		const supabase = createServerSideSupabaseClient();
        const user = await supabase
            .from<definitions['user']>('user')
            .select()
            .match({ email: requestBody.memberEmail })
            .single();
        if (user.data === null || user.error) {
            return {
                status: 500
            }
        } else {
            return {
                status: 200,
                body: {
                    userId: user.data.id
                }
            }
        }
    } catch (e) {
        return {
            status: 500
        }
    }
}