<script>
  import { Router, Link, Route, links } from 'svelte-routing'

  import Creatures from './routes/Creatures.svelte'
  import Home from './routes/Home.svelte'
  import NavBar from './components/NavBar.svelte'
  import PageHeader from './components/PageHeader.svelte'
</script>

<style>
  :global(body) {
    color: #717070;
  }

  :global(a:hover, a:visited, a:link, a:active) {
    text-decoration: none;
  }
</style>

<svelte:head>
  <!-- Font Awesome -->
  <link
    rel="stylesheet"
    href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/4.7.0/css/font-awesome.min.css" />

  <!-- Bootstrap 4-->
  <link
    rel="stylesheet"
    href="https://stackpath.bootstrapcdn.com/bootstrap/4.4.1/css/bootstrap.min.css"
    integrity="sha384-Vkoo8x4CGsO3+Hhxv8T/Q5PaXtkKtu6ug5TOeNV6gBiFeWPGFN9MuhOf23Q9Ifjh"
    crossorigin="anonymous" />

  <title>Quotes</title>

</svelte:head>

<div use:links>
  <Router>
    <div class="container">

      <PageHeader />

      <NavBar />

      <Route path="/">
        <Home />
      </Route>

      <Route path="creatures">
        <Creatures />
      </Route>

    </div>
  </Router>
</div>
