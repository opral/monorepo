import { CompactEncrypt, compactDecrypt, base64url } from "jose"

// enc = encoding
const enc = "A128CBC-HS256"
// dir = direct encryption
const alg = "dir"

/**
 * Encrypts a string using JWE.
 *
 * The string being the interim code returned from
 * https://docs.github.com/en/developers/apps/building-oauth-apps/authorizing-oauth-apps#2-users-are-redirected-back-to-your-site-by-github
 *
 * @throws
 */
export async function encryptAccessToken(args: {
	accessToken: string
	JWE_SECRET_KEY: string
}): Promise<string> {
	try {
		const secret = base64url.decode(args.JWE_SECRET_KEY)
		const jwe = await new CompactEncrypt(new TextEncoder().encode(args.accessToken))
			.setProtectedHeader({ alg, enc })
			.encrypt(secret)
		return jwe
	} catch (error) {
		throw Error("Failed to encrypt access token", { cause: error })
	}
}

/**
 * Decrypts a JWE obtained by `exchangeInterimCodeForJwe`.
 *
 * @important only call this function on the server-side.
 * @throws if the decryption fails
 */
export async function decryptAccessToken(args: {
	jwe: string
	JWE_SECRET_KEY: string
}): Promise<string> {
	const { plaintext } = await compactDecrypt(args.jwe, base64url.decode(args.JWE_SECRET_KEY))
	return new TextDecoder().decode(plaintext)
}

/**
 * Exchange the interim code for an access token.
 *
 * Read https://docs.github.com/en/developers/apps/building-oauth-apps/authorizing-oauth-apps#2-users-are-redirected-back-to-your-site-by-github
 */
export async function exchangeInterimCodeForAccessToken(args: {
	code: string
	githubAppClientId: string
	githubClientSecret: string
}): Promise<{ access_token: string }> {
	// fetch post request to github
	const request = await fetch(
		`https://github.com/login/oauth/access_token?client_id=${args.githubAppClientId}&client_secret=${args.githubClientSecret}&code=${args.code}`,
		{
			method: "POST",
			headers: {
				Accept: "application/json",
			},
		}
	)
	if (request.ok === false) {
		throw Error("exchanging the interim token failed", {
			cause: request.statusText,
		})
	}
	const requestBody = await request.json()
	if (requestBody.error) {
		throw Error("Exchanging the interim token failed", {
			cause: requestBody.error_description,
		})
	}

	return requestBody
}
