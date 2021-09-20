<script>
	import { t } from 'inlang';

	let numTodos = 0;
	let name = 'Samuel';
</script>

<h1>Pluralization Demo</h1>
<button on:click={() => numTodos++}>+</button>
<button on:click={() => numTodos--}>-</button>
<input bind:value={name} />
<p>
	{t(`Hello {name}, you have {num} todos.`)
		.variables({ name: name, num: numTodos })
		.plurals(numTodos, {
			zero: 'Hello {name}, you have no todos.',
			one: 'Hello {name}, you have one todo.'
		})}
</p>
