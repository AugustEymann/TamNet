<script>
    const CREATEUSER_URL = 'http://localhost:8080/auth/signup';
    import { navigate } from "svelte-routing";
    import { onMount } from "svelte";
    import NavBar from '../components/Navbar.svelte'
    let username;
    let firstName;
    let lastName;
    let password;
	let userData;
    let errorNotification = '';
    let users = [];
    let currentUser;

    function setCurrent(user) {
        currentUser = user
    }
    function getUsers() {
        fetch('http://localhost:8080/api/v1/users', {
            headers: {
                authorization: `Bearer ${localStorage.getItem('token')}`,
            },
            }).then(res => res.json())
            .then((result) => {
                users = result;
        });
    }

    function promoteUser() {
        fetch(`http://localhost:8080/api/v1/admin/promote/${currentUser._id}`, {
            headers: {
                authorization: `Bearer ${localStorage.getItem('token')}`,
            },
            }).then(res => res.json())
            .then((result) => {
            console.log(result)
            getUsers()
        });
    }

    function promptUsernameChange() {
        UIkit.modal.prompt('New Username:', 'Username').then((newUsername) => {
		const body = {
            userId: currentUser._id,
            newUsername: newUsername
        };
		fetch('http://localhost:8080/api/v1/admin/edit/', {
			method: 'POST',
			headers: {
                authorization: `Bearer ${localStorage.getItem('token')}`,
				'content-type': 'application/json',
			},
			body: JSON.stringify(body),
			}).then((response) => {
			if (response.ok) {
				return response.json();
			}
			return response.json().then((error) => {
				console.log(error.message)
				throw new Error(error.message);
			});
			}).then((result) => {
                console.log(result)
                getUsers()
			});
        });
    }

    function demoteUser() {
        fetch(`http://localhost:8080/api/v1/admin/demote/${currentUser._id}`, {
            headers: {
                authorization: `Bearer ${localStorage.getItem('token')}`,
            },
            }).then(res => res.json())
            .then((result) => {
            console.log(result)
            getUsers()
        });
    }

    function deleteUser() {
        fetch(`http://localhost:8080/api/v1/admin/delete/${currentUser._id}`, {
            headers: {
                authorization: `Bearer ${localStorage.getItem('token')}`,
            },
            }).then(res => res.json())
            .then((result) => {
            console.log(result)
            getUsers()
        });
    }

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
                  if (result.user.role !== 'admin') {
                       navigate('/dashboard', {replace: true});
                   } else {
                       userData = result.user
                   }
                } else {
                    localStorage.removeItem('token');
                }
            });
        getUsers()
    })

    function createUser() {
        let body = {
            firstName: firstName,
            lastName: lastName,
            username: username,
            password: password
        }
        fetch(CREATEUSER_URL, {
            method: 'POST',
            
			headers: {
                'content-type': 'application/json',
                authorization: `Bearer ${localStorage.getItem('token')}`,
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
            getUsers();
			}).catch((error) => {
                setTimeout(() => {
                    errorNotification = error.message;
                }, 1000);
			});
    }
</script>

<style>

</style>


<main>
    <NavBar/>
    <div class="uk-container">
    	{#if userData} 
            <h2>Admin Panel <span uk-icon="icon: cog; ratio: 1.5"></span></h2>
            <button class="uk-button uk-button-primary" type="button" uk-toggle="target: #modal-userCreator">Create a User</button>
            
              <div class="uk-margin-medium-top uk-grid-medium" uk-grid>
                    {#each users as user}
                    <div>
                        <div class="uk-card uk-card-default uk-card-hover uk-card-body">
                            <a on:click={setCurrent(user)} class="uk-position-right uk-padding-small" uk-toggle="target: #modal-userEditor" uk-icon="settings"></a>
                            <p>id: {user._id}</p>           
                            <p>Username: {user.username}</p>
                            <p>Role: {user.role}</p>
                        </div>
                    </div>
                    {/each}
            </div>


            <div id="modal-userEditor" uk-modal>
                <div class="uk-modal-dialog">
                    <button class="uk-modal-close-default" type="button" uk-close></button>
                    <div class="uk-modal-header">
                        <h2 class="uk-modal-title">User Settings</h2>
                    </div>
                     <div class="uk-modal-body" uk-overflow-auto>
                        {#if errorNotification !== ''} 
							<div class="uk-alert-danger" uk-alert>
								<a class="uk-alert-close" uk-close></a>
								<p>{errorNotification}</p>
							</div>						
						{/if}
                        {#if currentUser}
                            <button class="uk-button uk-button-danger uk-width-1-1 uk-margin-small-bottom" on:click={deleteUser}>Delete User</button>
                            {#if currentUser.role === 'user'}
                            <button class="uk-button uk-button-primary uk-width-1-1 uk-margin-small-bottom" on:click={promoteUser}>Promote</button>
                            {/if}
                            {#if currentUser.role !== 'user'}
                            <button class="uk-button uk-button-primary uk-width-1-1 uk-margin-small-bottom" on:click={demoteUser}>Demote</button>
                            {/if}
                            <button class="uk-button uk-button-primary uk-width-1-1 uk-margin-small-bottom" on:click={promptUsernameChange}>Change Username</button>
                        {/if}
                    </div>
                 <div class="uk-modal-footer uk-text-right">
                        <button class="uk-button uk-button-default uk-modal-close" type="button">Close</button>
                        
                    </div>

                </div>
            </div>
        
            <div id="modal-userCreator" uk-modal>
                <div class="uk-modal-dialog">
                    <button class="uk-modal-close-default" type="button" uk-close></button>
                    <div class="uk-modal-header">
                        <h2 class="uk-modal-title">Account Creation</h2>
                    </div>
                    <div class="uk-modal-body" uk-overflow-auto>
                        {#if errorNotification !== ''} 
							<div class="uk-alert-danger" uk-alert>
								<a class="uk-alert-close" uk-close></a>
								<p>{errorNotification}</p>
							</div>						
						{/if}
						<form>
                        	<div class="uk-margin">
								<div class="uk-inline uk-width-1-1">
									<span class="uk-form-icon" uk-icon="icon: user"></span>
									<input class="uk-input uk-form-large" bind:value={firstName} placeholder="First Name" type="text">
								</div>
							</div>
                            <div class="uk-margin">
								<div class="uk-inline uk-width-1-1">
									<span class="uk-form-icon" uk-icon="icon: users"></span>
									<input class="uk-input uk-form-large" bind:value={lastName} placeholder="Last Name" type="text">
								</div>
							</div>
							<div class="uk-margin">
								<div class="uk-inline uk-width-1-1">
									<span class="uk-form-icon" uk-icon="icon: user"></span>
									<input class="uk-input uk-form-large" bind:value={username} placeholder="Username" type="text">
								</div>
							</div>
							<div class="uk-margin">
								<div class="uk-inline uk-width-1-1">
									<span class="uk-form-icon" uk-icon="icon: lock"></span>
									<input class="uk-input uk-form-large" bind:value={password}  placeholder="Password" type="password">	
								</div>
							</div>
                    </div>

                    <div class="uk-modal-footer uk-text-right">
                        <button class="uk-button uk-button-default uk-modal-close" type="button">Cancel</button>
                        <button class="uk-button uk-button-primary" on:click={createUser} type="button">Create</button>
                    </div>

                </div>
            </div>
        

        {:else}
            <center>
                <img src="https://faviconer.net/preloaders/25/Snake.gif" alt="Loading...">
            </center>
        {/if}
    </div>
</main>