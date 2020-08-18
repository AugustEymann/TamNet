<script>
    import { navigate } from "svelte-routing";
    import { onMount } from "svelte";
    import NavBar from '../components/Navbar.svelte'
    import { tick } from 'svelte';

	let files;
    let userData;
    let archiveData = [];
    let image = 'http://localhost:8080/api/v1/uploads/'
    let currentImage = ''
    let searchParam = ''
    let currentFilter = 'Date'
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

    function setFilter(newFilter) {
        console.log(newFilter)
        currentFilter = newFilter;
    }

    function filterList() {
        if (searchParam === '') {
            getArchive();
        } else {
        archiveData = archiveData.filter(function (e) {
            let info = e[currentFilter.toLowerCase()]
            return info.includes(searchParam)
        });
        }   
    }
    


</script>

<style>
  
</style>


<main>
    <NavBar/>
    <div class="uk-container">
    	{#if userData}

        <h2>Photo Archive 📸</h2>

        <button class="uk-button uk-button-primary" type="button" uk-toggle="target: #modal-imageUploader">Upload</button>

        {:else}
            <center>
                <img src="https://faviconer.net/preloaders/25/Snake.gif" alt="Loading...">
            </center>
        {/if}
       <div class="uk-align-right uk-inline">
            <button class="uk-button uk-button-default" type="button">{currentFilter}</button>
            <div uk-dropdown="mode:click">
             <ul class="uk-nav uk-dropdown-nav">
                <li><a on:click={() => setFilter('Date')} href="#">Date</a></li>
                <li><a on:click={() => setFilter('Company')} href="#">Company</a></li>
                <li><a on:click={() => setFilter('Project')} href="#">Project</a></li>
                <li><a on:click={() => setFilter('Location')} href="#">Location</a></li>
                <li><a on:click={() => setFilter('TP')} href="#">TP #</a></li>
                <li><a on:click={() => setFilter('People')} href="#">People</a></li>
                </ul>
            </div>
        </div>
            <form class="uk-align-right uk-search uk-search-default">
            <a uk-search-icon on:click={filterList}></a>
            <input class="uk-search-input " bind:value={searchParam} placeholder=""/>
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

     
        <div id="modal-imageUpload" uk-modal>
            <div class="uk-modal-dialog">
                <button class="uk-modal-close-default" type="button" uk-close></button>
                <div class="uk-modal-header">
                    <h2 class="uk-modal-title">Account Creation</h2>
                </div>
                <div class="uk-modal-body" uk-overflow-auto>
                  
                    <form>
                        <div class="uk-margin">
                            <div class="uk-inline uk-width-1-1">
                                <span class="uk-form-icon" uk-icon="icon: user"></span>
                                <input class="uk-input uk-form-large" placeholder="First Name" type="text">
                            </div>
                        </div>
                        <div class="uk-margin">
                            <div class="uk-inline uk-width-1-1">
                                <span class="uk-form-icon" uk-icon="icon: users"></span>
                                <input class="uk-input uk-form-large"  placeholder="Last Name" type="text">
                            </div>
                        </div>
                        <div class="uk-margin">
                            <div class="uk-inline uk-width-1-1">
                                <span class="uk-form-icon" uk-icon="icon: user"></span>
                                <input class="uk-input uk-form-large"  placeholder="Username" type="text">
                            </div>
                        </div>
                        <div class="uk-margin">
                            <div class="uk-inline uk-width-1-1">
                                <span class="uk-form-icon" uk-icon="icon: lock"></span>
                                <input class="uk-input uk-form-large"   placeholder="Password" type="password">	
                            </div>
                        </div>
                </div>

                <div class="uk-modal-footer uk-text-right">
                    <button class="uk-button uk-button-default uk-modal-close" type="button">Cancel</button>
                    <button class="uk-button uk-button-primary" type="button">Create</button>
                </div>

            </div>
        </div>
    
</main>