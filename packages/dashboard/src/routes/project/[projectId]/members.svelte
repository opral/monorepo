<script lang="ts">
    import { TextInput, Button } from "carbon-components-svelte";
    import SendAlt24 from "carbon-icons-svelte/lib/SendAlt32";

    async function inviteUser(email: string) {
        
    }

</script>

<div class="p-8">
	<h1>Members</h1>
    <p class="text-gray-600 mt-1 mb-3">Invite members to the organization of current project.</p>

    
    <row class="space-x-4 items-center">
    <TextInput size="xl" placeholder="Enter email of user to invite"></TextInput>
    <Button  icon={SendAlt24}>Invite</Button>
    </row>
</div>
