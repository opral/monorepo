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
    let url1 = 'https://us-central1-inlang-92d67.cloudfunctions.net/helloWorld'
    const url2 = 'https://app.inlang.dev/api/internal/create-base-translation'

    const response = await fetch(
        url1,
        {
            method: 'POST',
            body: JSON.stringify(data),
            headers: { 'Content-Type': 'application/json' },
        }
    )
    return response
}
