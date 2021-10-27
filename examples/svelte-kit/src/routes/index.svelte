<script lang="ts">
	import LL, { setLocale, locale } from '../i18n/i18n-svelte';
	let name = '';
	let color = 'red';

	function handleLanguageSelection(event: any) {
		// setting the i18n route. Basically, it replaces the language slug in the route with a new one.
		// Replacing the language slug will automatically set the language in the _app.tsx component.
		// read more here https://docs.inlang.dev/definitions/i18n-routing
		setLocale(event.target.value);
	}

	$: translatedColor = () => {
		if (color === 'blue') {
			return $LL.random_prefix_color_blue();
		} else if (color === 'green') {
			return $LL.random_prefix_color_green();
		} else if (color === 'orange') {
			return $LL.random_prefix_color_orange();
		} else {
			return $LL.random_prefix_color_red();
		}
	};
</script>

<div class="mx-auto p-4 flex flex-col space-y-4 items-center justify-center bg-base-100">
	<div class="max-w-4xl">
		<div class="flex justify-between items-center">
			<form>
				<label class="label">
					{$LL.random_prefix_select_language()}
				</label>
				<select
					class="select select-bordered w-fu$ll max-w-xs"
					value={$locale}
					on:change={handleLanguageSelection}
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
				{$LL.random_prefix_star_inlang()}
			</a>
		</div>
		<br />
		<h1
			class="text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r py-1 from-purple-400 via-pink-500 to-red-500"
		>
			{$LL.random_prefix_welcome()}
		</h1>
		<br />
		<div class="grid grid-cols-2 gap-6">
			<div class="card shadow">
				<div class="card-body">
					<h2 class="card-title">
						{$LL.random_prefix_localized_by_us()}
					</h2>
					<div class="form-control">
						<label class="label">
							<span class="label-text">
								{$LL.random_prefix_as_name()}
							</span>
						</label>
						<input
							type="text"
							bind:value={name}
							placeholder={$LL.random_prefix_enter_name()}
							class="input input-bordered"
						/>
					</div>
					<br />
					<p class="text-sm pb-1">
						{$LL.random_prefix_ask_favorite_color()}
					</p>
					<div class="flex space-x-2 justify-between">
						<button
							on:click={() => (color = 'blue')}
							class={`btn btn-square btn-outline btn-info ${color === 'blue' ? 'btn-active' : ''} `}
						>
							{' '}
						</button>
						<button
							on:click={() => (color = 'green')}
							class={`btn btn-square btn-outline btn-success ${
								color === 'green' ? 'btn-active' : ''
							}`}
						>
							{' '}
						</button>
						<button
							on:click={() => (color = 'orange')}
							class={`btn btn-square btn-outline btn-warning ${
								color === 'orange' ? 'btn-active' : ''
							} `}
						>
							{' '}
						</button>
						<button
							on:click={() => (color = 'red')}
							class={`btn btn-square btn-outline btn-error ${color === 'red' ? 'btn-active' : ''} `}
						>
							{' '}
						</button>
					</div>
					<div class="divider" />
					<p class="font-bold">
						{$LL.random_prefix_interpolated_string({
							color: translatedColor(),
							name: name
						})}
					</p>
				</div>
			</div>
			<div class="card shadow">
				<figure>
					<img
						src="https://raw.githubusercontent.com/inlang/inlang/main/assets/highlight-text.gif"
						alt="Highlight text and send to inlang."
					/>{' '}
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
				</div>
			</div>
		</div>
		<br />
		<div class="card shadow">
			<div class="card-body">
				<h2 class="card-title">
					{$LL.random_prefix_invite_collaborators()}
				</h2>
				<div class="grid grid-cols-2 gap-4 justify-items-center">
					<div class="flex flex-col justify-center">
						<a
							href="https://app.inlang.dev"
							target="_blank"
							rel="noreferrer"
							class="link-primary text-lg"
						>
							{$LL.random_prefix_create_project()}
						</a>
						<br />
						<p class="text-lg">
							{$LL.random_prefix_replace_project_id()}
						</p>
						<p class="text-sm text-gray-500">
							{$LL.random_prefix_find_project_id()}
						</p>
						<br />
						<p class="text-lg">{$LL.random_prefix_npm_run_dev()}</p>
						<p class="text-sm text-gray-500">
							{$LL.random_prefix_linting_errors()}
							<a
								class="link-secondary"
								href="https://cdn.forms-content.sg-form.com/e22e6493-370b-11ec-9784-62d300bd6ea3"
								target="_blank"
								rel="noreferrer"
							>
								{$LL.random_prefix_newsletter()}
							</a>
						</p>
					</div>
					<img
						alt=""
						class="h-80 w-80"
						src="https://raw.githubusercontent.com/inlang/inlang/main/assets/step2-half.gif"
					/>
				</div>
			</div>
		</div>
		<br />
		<div class="grid grid-cols-2 gap-20 justify-items-center">
			<div>
				<h2 class="card-title">{$LL.random_prefix_early_alpha()}</h2>
				<p>{$LL.random_prefix_feedback_helps_us()}</p>
				<a href="https://submission.bromb.co/inlang/examples" class="link-primary">
					{$LL.random_prefix_ask_feedback_on_this_example()}
				</a>
			</div>
			<div>
				<h2 class="card-title">Community</h2>
				<div class="flex space-x-10 items-center">
					<a href="https://github.com/inlang/inlang" target="_blank" rel="noreferrer">
						<img
							alt="GitHub"
							class="mx-auto"
							height="32"
							width="32"
							src="https://cdn.jsdelivr.net/npm/simple-icons@v5/icons/github.svg"
						/>
						GitHub
					</a>
					<a href="https://discord.gg/CUkj4fgz5K" target="_blank" rel="noreferrer">
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
		<iframe
			title=""
			class="w-full h-96"
			src="https://cdn.forms-content.sg-form.com/e22e6493-370b-11ec-9784-62d300bd6ea3"
		/>
	</div>
</div>
