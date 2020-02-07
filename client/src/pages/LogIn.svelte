<script>
	const LOGIN_URL = 'http://localhost:8080/auth/login';
	import { navigate } from "svelte-routing";
	import { onMount } from "svelte";
	let username = '';
	let password = '';
	let errorNotification = '';

    onMount(() => {
        if (localStorage.getItem('token')) {
            navigate('/dashboard')
        }
    })

	function signIn() {
		const body = {
			username: username,
			password: password,
		};
		fetch(LOGIN_URL, {
			method: 'POST',
			headers: {
				'content-type': 'application/json',
			},
			body: JSON.stringify(body),
			}).then((response) => {
			if (response.ok) {
				return response.json();
			}
			return response.json().then((error) => {
				errorNotification = error.message;
				console.log(error.message)
				throw new Error(error.message);
			});
			}).then((result) => {
			localStorage.setItem('token', result.token);
			setTimeout(() => {
				navigate("/dashboard", { replace: true });
			}, 1000);
			}).catch((error) => {
			setTimeout(() => {
				errorNotification = error.message;
			}, 1000);
			});
	}
	

</script>

<main>
    <center>
        <div class="uk-section uk-section-muted uk-flex uk-flex-middle uk-animation-fade" uk-height-viewport>
		<div class="uk-container">
            <img class="mainImage" src="https://thinklocalsantacruz.org/logos/social_media/limage-1644-336-photo.png" alt="Tam Communications">
			<div class="uk-grid-margin uk-grid uk-grid-stack" uk-grid>
				<div class="uk-width-1-1@m">
					<div class="uk-margin uk-width-large uk-margin-auto uk-card uk-card-default uk-card-body uk-box-shadow-large">
						{#if errorNotification !== ''} 
							<div class="uk-alert-danger" uk-alert>
								<a class="uk-alert-close" uk-close></a>
								<p>{errorNotification}</p>
							</div>						
						{/if}

						<h3 class="uk-card-title uk-text-center">Welcome!</h3>
						<form on:submit|preventDefault={signIn}>
							<div class="uk-margin">
								<div class="uk-inline uk-width-1-1">
									<span class="uk-form-icon" uk-icon="icon: user"></span>
									<input class="uk-input uk-form-large" bind:value={username} type="text">
								</div>
							</div>
							<div class="uk-margin">
								<div class="uk-inline uk-width-1-1">
									<span class="uk-form-icon" uk-icon="icon: lock"></span>
									<input class="uk-input uk-form-large" bind:value={password} type="password">	
								</div>
							</div>
							<div class="uk-margin">
								<button class="uk-button uk-button-primary uk-button-large uk-width-1-1">Login</button>
							</div>
							<div class="uk-text-small uk-text-center">
								Not registered? Ask an Administrator
							</div>
						</form>
					</div>
				</div>
			</div>
		</div>
</div>
    </center>
</main>

<style>
    .mainImage {
        position: relative;
        margin-left: auto;
        margin-right: auto;
        top: 100%;
    }
</style>