<script lang="ts">
	import type { Locales } from 'src/i18n/i18n-types';
	import LL, { setLocale } from '../i18n/i18n-svelte';
	let name = '';
	let selected: Locales;
	let color = 'red';
</script>

<div class="w-screen h-screen p-4 flex flex-col space-y-4 items-center justify-center bg-base-100">
	<div class="max-w-4xl">
		<div class="flex justify-between items-center">
			<form>
				<label class="label">{$LL.index.selectLanguage()}</label>
				<select
					class="select select-bordered w-full max-w-xs"
					bind:value={selected}
					on:change={() => {
						setLocale(selected);
						color = '';
					}}
				>
					<option value="en">🇬🇧 English</option>
					<option value="fr">🇫🇷 French</option>
					<option value="de">🇩🇪 German</option>
					<option value="nl">🇳🇱 Dutch</option>
					<option value="da">🇩🇰 Danish</option>
				</select>
			</form>
			<a
				href="https://github.com/inlang/inlang"
				target="_blank"
				rel="noreferrer"
				class="btn btn-ghost"
			>
				{$LL.index.star()}
			</a>
		</div>
		<br />
		<h1
			class="text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r py-1 from-purple-400 via-pink-500 to-red-500"
		>
			{$LL.welcome()}
		</h1>
		<br />
		<div class="grid grid-cols-2 gap-6">
			<div class="card shadow">
				<div class="card-body">
					<h2 class="card-title">{$LL.index.card()}</h2>
					<div class="form-control">
						<label class="label">
							<span class="label-text">{$LL.index.name()}</span>
						</label>
						<input
							type="text"
							placeholder={$LL.index.enterName()}
							class="input input-bordered"
							bind:value={name}
						/>
					</div>
					<br />
					<p class="text-sm pb-1">{$LL.index.favoriteColor()}</p>
					<div class="flex space-x-2 justify-between">
						<button
							on:click={() => (color = $LL.index.blue())}
							class={`btn btn-square btn-outline btn-info ${
								color === $LL.index.blue() ? 'btn-active' : ''
							} `}
						>
							{' '}
						</button>
						<button
							on:click={() => (color = $LL.index.green())}
							class={`btn btn-square btn-outline btn-success ${
								color === $LL.index.green() ? 'btn-active' : ''
							}`}
						>
							{' '}
						</button>
						<button
							on:click={() => (color = $LL.index.orange())}
							class={`btn btn-square btn-outline btn-warning ${
								color === $LL.index.orange() ? 'btn-active' : ''
							} `}
						>
							{' '}
						</button>
						<button
							on:click={() => (color = $LL.index.red())}
							class={`btn btn-square btn-outline btn-error ${
								color === $LL.index.red() ? 'btn-active' : ''
							} `}
						>
							{' '}
						</button>
					</div>
					<div class="divider" />
					<p class="font-bold">
						{$LL.index.nameAndColor({ name: name, color: color })}
					</p>
				</div>
			</div>
			<div class="card shadow">
				<figure>
					<img src="/highlight-text.gif" alt="Highlight text and send to inlang." />{' '}
				</figure>
				<div class="card-body">
					<h2 class="card-title">2. Localize this card yourself</h2>

					<a
						class="link"
						href="https://marketplace.visualstudio.com/items?itemName=inlang.vscode-extension"
						target="_blank"
						rel="noreferrer"
					>
						1. Download the VSCode extension
					</a>
					<p>2. Highlight the text you want to localize.</p>
					<p>3. Open the context menu (right click) and press send to inlang</p>
					<p>
						4. Enter a key name, pre-fixed a random id (to avoid namespace collisions), and wait up
						to 2 seconds.
					</p>
					<br />
					<p>
						Bonus: {name}, localize this text as you did before. What happens?
					</p>
					<br />
					<a href="https://docs.inlang.dev/getting-started/dashboard" class="link-primary">
						Want to see the dashboard?
					</a>
				</div>
			</div>
		</div>
		<br />
		<div class="card shadow">
			<div class="card-body grid grid-cols-2 gap-20">
				<div>
					<h2 class="card-title">{$LL.index.alpha()}</h2>
					<p>{$LL.index.feedback()}</p>
					<a href="https://submission.bromb.co/inlang/examples" class="link-primary">
						{$LL.index.giveFeedback()}
					</a>
				</div>
				<div>
					<h2 class="card-title">{$LL.index.community()}</h2>
					<div class="flex space-x-10 items-center">
						<a href="https://github.com/inlang/inlang">
							<img
								alt="GitHub"
								class="mx-auto"
								height="32"
								width="32"
								src="https://cdn.jsdelivr.net/npm/simple-icons@v5/icons/github.svg"
							/>
							GitHub
						</a>
						<a href="https://discord.gg/CUkj4fgz5K">
							<img
								alt="Discord"
								height="32"
								class="mx-auto"
								width="32"
								src="https://cdn.jsdelivr.net/npm/simple-icons@v5/icons/discord.svg"
							/>
							Discord
						</a>
					</div>
				</div>
			</div>
		</div>
	</div>
</div>
