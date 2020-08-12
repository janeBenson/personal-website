<script>
  import { link } from 'svelte-routing'
</script>

<style>
  .container-fluid {
    padding-top: 70px;
    padding-bottom: 70px;
    color: white;
  }

  .bg-1 {
    background-color: white;
    color: #555555;
  }
  .bg-2 {
    background-color: #ff4e50;
    color: #ffffff;
  }
  .bg-3 {
    background-color: white;
    color: #555555;
  }
</style>

<div class="container-fluid bg-1 text-center">
  <h3 class="mb-4">Jane E. Benson</h3>
  <img
    src="/imgs/jane.png"
    class="img-thumbnail img-fluid"
    alt="Jane"
    width="350"
    height="350" />
  <h3 class="mt-4">Web Developer & Technical Writer</h3>
</div>

<div class="container-fluid bg-2">
  <div class="row">
    <div class="col-4 text-center align-self-center">
      <h1>"Programming is the purest form of applied math"</h1>
    </div>
    <div class="col">
      <p>
        Hi there! I'm Jane - web developer, technical writer, and mom of two
        (rabbits). I received my Bachelors degree in math from the University of
        Minnesota in 2016. My journey from college to present has expanded my
        professional skillset and informed my professional philosophy. With
        various experiences in math education and technical communication, I've
        adopted teaching as a philosophy. I'm a firm believer that you can only
        master a topic if you can effectively teach it to someone else. I strive
        to be approachable and open-minded in everything I do. As cliche as it
        sounds, there is something new to learn each day. It's important to be
        receptive to it.
        <br />
        <br />
        My experiences as a technical writer - documentating software for
        developers, testing API endpoints in Postman, catching bugs, and
        creating my own code samples - provided me with invaluable experience
        and a desire to be the one creating the software. Translating tech into
        english is my forte and is especially useful when annotating code,
        naming variables, communicating my technical masterpieces to others, and
        approaching projects in a logical manner.
        <br />
        <br />
        My love for software development began in my first computer science
        class. I saw the very logic that I learned in my mathematical proofs
        class applied to solve a real-world problem in Python. That logical
        "and" operator sent shivers up my spine. In that moment, I realized
        programming is the purest form of applied math.
        <br />
        <br />
        When I'm not technical writing or coding, you can find me hiking,
        listening to music, trying out new, plant-based recipes, photographing
        lighthouses, and building castles for my rabbits.
        <br />
        <br />
        Thanks for reading my novel. I can't wait to connect with you.
        <br />
        <br />
        - Jane
      </p>
    </div>
  </div>
</div>

<div class="container-fluid bg-3 text-center">
  <h3>Portfolio</h3>
  <div class="row">
    <div class="col-md-4 .col-sm-">
      <p>Random Image Generator</p>
      <a href="/portfolio/random-image-generator" use:link>
        <img
          src="/imgs/random-images.jpg"
          class="rounded img-fluid"
          alt="Image" />
      </a>
    </div>
    <div class="col-md-4 .col-sm-">
      <p>To Do List</p>
      <a href="/resume">
        <img src="/imgs/to-do-list.jpg" class="rounded img-fluid" alt="Image" />
      </a>
    </div>
    <div class="col-md-4 .col-sm-">
      <p>Websockets</p>
      <img src="/imgs/websockets.jpg" class="rounded img-fluid" alt="Image" />
    </div>
  </div>

  <div class="text-center mt-4">
    <a href="/portfolio" type="button" class="btn btn-outline-dark">See More</a>
  </div>
</div>
