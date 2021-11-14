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

export async function post(request: Request): Promise<EndpointOutput> {
	dotenv.config();

	if (request.headers['content-type'] !== 'application/json') {
		return {
			status: 405
		};
	}

	try {
		const requestBody = (request.body as unknown) as CreateMemberRequestBody;
		const supabase = createServerSideSupabaseClient();
        //get invited user if exists
		const newMember = await supabase
			.from<definitions['user']>('user')
			.select()
			.match({ email: requestBody.memberEmail })
			.single();
		if (newMember.data === null || newMember.error) {
			//user is not signed up
			return {
				status: 500
			};

		}
        //upsert member
        const memberUpsert = await supabase.from<definitions['member']>('member').insert({
            organization_id: requestBody.organizationId,
            user_id: newMember.data.id,
            role: requestBody.role
        });
        if (memberUpsert.error) {
            console.error(memberUpsert.error);
            alert(memberUpsert.error.message);
        }
        if (memberUpsert.status === 409) {
            //is already member
            return {
                status: 409
            }
        } else if (memberUpsert.status === 201) {
            //success
            return {
                status: 201
            }
        }
        return {
            status: 200
        }
	} catch (e) {
		console.error(e);
		return {
			status: 500
		};
	}
}