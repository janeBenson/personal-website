<script>
  import { Router, Link, Route, links } from 'svelte-routing'
  import { onMount } from 'svelte'

  import Creatures from './routes/Creatures.svelte'
  import Footer from './components/Footer.svelte'
  import Home from './routes/Home.svelte'
  import NavBar from './components/NavBar.svelte'
  import Portfolio from './routes/Portfolio.svelte'
  import RandomImageGenerator from './routes/portfolio/RandomImageGenerator.svelte'
  import Resume from './routes/Resume.svelte'

  import scrollToTop from './utils/scrollToTop.js'
</script>

<style>

</style>

<svelte:head>

  <link rel="icon" href="/imgs/rabbit.png" />

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

  <!-- Google Font -->
  <link
    href="https://fonts.googleapis.com/css?family=Montserrat"
    rel="stylesheet" />

  <title>Jane Benson</title>

</svelte:head>

<div use:links>
  <Router>

    <NavBar />

    <Route path="/">
      <Home />
    </Route>

    <Route path="resume">
      <Resume />
    </Route>

    <Route path="portfolio">
      <Portfolio />
    </Route>

    <Route path="creatures">
      <Creatures />
    </Route>

    <!-- Portfolio items -->
    <Route path="/portfolio/random-image-generator">
      <RandomImageGenerator />
    </Route>

    <Footer />

  </Router>
</div>
