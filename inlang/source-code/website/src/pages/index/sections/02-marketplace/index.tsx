import { Button } from "../../components/Button.jsx"
import { CardTag } from "../../components/CardTag.jsx"
import { SectionLayout } from "../../components/sectionLayout.jsx"
import AppFlowy from "./assets/logos/appflowy.jsx"
import Calcom from "./assets/logos/clacom.jsx"
import Jitsi from "./assets/logos/jitsi.jsx"
import Listmonk from "./assets/logos/listmonk.jsx"
import OpenAssistant from "./assets/logos/openAssistant.jsx"
import App from "./assets/categories/app.jsx"
import Email from "./assets/categories/email.jsx"
import Payments from "./assets/categories/payments.jsx"
import Website from "./assets/categories/website.jsx"
import Documents from "./assets/categories/documents.jsx"

const Marketplace = () => {
	return (
		<>
			<SectionLayout showLines={true}>
				<div class="h-screen">
					<div class="relative w-full pb-2">
						<img src="/images/landingpage/marketplace_apps.png" class="w-full max-w-5xl mx-auto" />
						<div class="absolute inset-0 z-10 bg-gradient-to-t from-surface-100/0 via-surface-100/0 via-70% to-surface-100/70 mix-blend-lighten" />
					</div>
					<div class="mx-auto flex flex-col items-center">
						<h1 class="text-center text-4xl md:text-[50px] font-bold mb-8">
							Explore the ecosystem
						</h1>
						<p class="text-center text-surface-600 md:text-xl text-lg mb-12">
							No matter your requirements,
							<br /> there is a module for that.
						</p>
						<Button type="primary" href="/marketplace">
							Browse Marketplace
						</Button>
					</div>
				</div>
			</SectionLayout>
		</>
	)
}

export default Marketplace
