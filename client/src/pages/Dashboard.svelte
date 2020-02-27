<script>
    import { navigate } from "svelte-routing";
    import { onMount } from "svelte";
    import NavBar from '../components/Navbar.svelte'

	let userData;

    onMount(() => {
        if (!localStorage.getItem('token')) {
            navigate('/')
        }

        fetch('http://localhost:8080/', {
            headers: {
                authorization: `Bearer ${localStorage.getItem('token')}`,
            },
            }).then(res => res.json())
            .then((result) => {
                if (result.user) {
                    userData = result.user
                } else {
                    localStorage.removeItem('token');
                }
            });
    })

</script>

<style>

</style>


<main>
    <NavBar/>
    <div class="uk-container">
    	{#if userData} 
            <h2>Welcome, {userData.firstName} 🔥</h2>
        {:else}
            <center>
                <img src="https://faviconer.net/preloaders/25/Snake.gif" alt="Loading...">
            </center>
        {/if}
    </div>
</main>