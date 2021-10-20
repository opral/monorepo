import fetch from 'node-fetch'

export type CreateBaseTranslationRequestBody = {
    projectId: string
    baseTranslation: {
        key_name: string
        text: string
    }
}

export async function postTranslateRequest(
    data: CreateBaseTranslationRequestBody
) {
    const response = await fetch(
        'https://app.inlang.dev/api/internal/create-base-translation',
        {
            method: 'POST',
            body: JSON.stringify(data),
            headers: { 'Content-Type': 'application/json' },
        }
    )
    return response
}
