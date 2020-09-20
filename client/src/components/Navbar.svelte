<script>
    import { Link, navigate } from "svelte-routing";
    import { onMount } from "svelte";
	var userData;

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

    function logOut() {
        localStorage.removeItem('token')
        navigate('/', {replace: true})
    }
</script>

<nav class="uk-navbar-container uk-margin" uk-navbar>
    <div class="uk-navbar-left">
        <div class="uk-navbar-item uk-logo">
            <img src='http://localhost:8080/cdn/tamTranspo.png' alt="TamNet" width="100px" height="100px"/>
        </div>
        <ul class="uk-navbar-nav">
            <li>
                <Link to="/dashboard">
                    Dashboard
                </Link>
            </li>
        </ul>
        <ul class="uk-navbar-nav">
            <li>
                <Link to="/dashboard">
                    Projects
                </Link>
            </li>
        </ul>
        <ul class="uk-navbar-nav">
            <li>
                <Link to="/archive">
                    Photo Archive
                </Link>
            </li>
        </ul>
        {#if userData}
            {#if userData.role === 'admin'}
            <ul class="uk-navbar-nav">
                <li>
                    <Link to="/admin">
                        Admin Panel
                    </Link>
                </li>
            </ul>
            {/if}
        {/if}
    </div>
    <div class="uk-navbar-right">
     <ul class="uk-navbar-nav uk-margin-medium-right">
        <li>
            <button class="uk-button uk-button-danger" on:click={logOut}>
                Logout <span uk-icon="sign-out"></span>
            </button>
        </li>
        </ul>
    </div>
</nav>
