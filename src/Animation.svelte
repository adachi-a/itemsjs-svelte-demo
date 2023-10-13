<script>
  import Search from './AnimationSearch.svelte';
  import './app.scss';
  import * as bootstrap from 'bootstrap';
</script>

<svelte:head>
  <meta name="robots" content="noindex, nofollow" />
</svelte:head>

<header class="navbar bg-danger navbar-expand-md" data-bs-theme="dark">
  <nav class="container-md flex-wrap flex-md-nowrap" aria-label="Main navigation">
    <!-- svelte-ignore a11y-invalid-attribute -->
    <a class="navbar-brand p-0 me-4" href="#"><span>ItemsJS + Svelte</span></a>
    <div class="collapse navbar-collapse">
      <ul class="navbar-nav ms-auto" />
      <ul class="navbar-nav mb-2 mb-md-0">
        <li class="nav-item pe-2">
          <a class="nav-link" aria-current="page" href="https://adachi-a.github.io/itemsjs-svelte-demo/">交番・派出所</a>
        </li>
        <li class="nav-item pe-2">
          <a class="nav-link" aria-current="page" href="https://github.com/itemsapi/itemsjs">ItemsJS</a>
        </li>
        <li class="nav-item pe-2">
          <a class="nav-link" aria-current="page" href="https://www.fusejs.io/">Fuse.js</a>
        </li>
        <li class="nav-item pe-2">
          <a class="nav-link" aria-current="page" href="https://svelte.dev/">Svelte</a>
        </li>
        <li class="nav-item">
          <a class="nav-link" href="https://github.com/adachi-a/itemsjs-svelte-demo"><i class="bi bi-github" /></a>
        </li>
      </ul>
    </div>
  </nav>
</header>

<div class="container">
  <Search />
</div>
