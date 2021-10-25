import {useContext} from 'react'
import { I18nContext } from "./i18n/i18n-react"

function Learn() {
    const {LL} = useContext(I18nContext);
    return <p>{LL.learn()}</p>
}

export default Learn