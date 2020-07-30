<script>
    import { navigate } from "svelte-routing";
    import { onMount } from "svelte";
    import NavBar from '../components/Navbar.svelte'
    
	let files;
    let userData;
    let archiveData = [];
    let image = 'http://localhost:8080/api/v1/uploads/'
    let currentImage = ''

    function getArchive() {
        fetch('http://localhost:8080/api/v1/archive', {
            headers: {
                authorization: `Bearer ${localStorage.getItem('token')}`,
            },
            }).then(res => res.json())
            .then((result) => {
                archiveData = result
        }); 
    }

    function filterArchive(filter,search) {
        archiveData.filter(function(a) {
            return a[filter] == search
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
                    userData = result.user
                } else {
                    localStorage.removeItem('token');
                }
            });
        getArchive();
    })

    function fileHandle() {
        let file = files[0]
        if (file.type.includes('image')) {
            document.getElementById('imagePreview').src = window.URL.createObjectURL(file)
        } else {
            file = null;
        }
    }

    function changeImage(data) {
        currentImage = image + data
    }
 


</script>

<style>
  
</style>


<main>
    <NavBar/>
    <div class="uk-container">
    	{#if userData}

        <h2>Photo Archive 📸</h2>

        <button class="uk-button uk-button-primary" type="button" >Select</button>

        {:else}
            <center>
                <img src="https://faviconer.net/preloaders/25/Snake.gif" alt="Loading...">
            </center>
        {/if}
       <div class="uk-inline">
            <button class="uk-button uk-button-default" type="button">Click</button>
            <div uk-dropdown="mode: click">
             <ul class="uk-nav uk-dropdown-nav">
                <li><a href="#">Date</a></li>
                <li><a href="#">Company</a></li>
                <li><a href="#">Project</a></li>
                <li><a href="#">Location</a></li>
                <li><a href="#">TP #</a></li>
                <li><a href="#">People</a></li>
                </ul>
            </div>
        </div>
        <form class="uk-search uk-search-default">
            <span uk-search-icon></span>
            <input class="uk-search-input" type="search" placeholder="">
        </form> 
        <table class="uk-table uk-table-divider">
            <thead>
                <tr>
                    <th>Date</th>
                    <th>Company</th>
                    <th>Project</th>
                    <th>Location</th>
                    <th>TP #</th>
                    <th>People</th>
                    <th>Image</th>
                </tr>
            </thead>
            <tbody>
            	{#each archiveData as data}
                    <tr>
                        <td>{data.date}</td>
                        <td>{data.company}</td>
                        <td>{data.project}</td>
                        <td>{data.location}</td>
                        <td>{data.tp}</td>
                        <td>{data.people}</td>
                        <td><a on:click={() => changeImage(data.fileName)} uk-toggle="target: #modal-close-outside">View Image</a></td>
                    </tr>
                {/each}
            </tbody>
        </table>
            <div id="modal-close-outside" uk-modal>
                <div class="uk-modal-dialog uk-modal-body">
                    <button class="uk-modal-close-outside" type="button" uk-close></button>
                    <img height="100%" width="100%" src={currentImage}>
                </div>
            </div>
        </div>
</main>