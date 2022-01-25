<script>
	export let xAxis = true;
	export let yAxis = true;
</script>

<div
	style={`
      display: flex; 
      flex-direction: column;
      ${xAxis ? 'align-items: center;' : ''}
      ${yAxis ? 'justify-content: center;' : ''}
      height: 100%;
      width: 100%;
      `}
>
	<div>
		<slot />
	</div>
</div>
