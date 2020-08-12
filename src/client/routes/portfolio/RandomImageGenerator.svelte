<script>
  import About from '../../components/About.svelte'

  import scrollToTop from '../../utils/scrollToTop.js'

  let author, portfolio, src
  let buttonText = 'Get your random image!'
  let buttonDisabled = false
  let clickCount = 0
  let aboutData = {
    title: 'Random Image Generator',
    summary: `This project uses the <a href="https://unsplash.com/documentation#get-a-random-photo" target="_blank">Unsplash API</a> to get a random image when the button is clicked.`,
    tags: ['Fetch API', 'Unsplash API', 'Bootstrap', 'Svelte'],
    link: '/'
  }

  async function getImage() {
    try {
      const data = await fetch('/api/random-image').then((res) => res.json())
      console.log(data)
      author = data.author.name
      portfolio = data.author.portfolio
      src = data.urls.small
    } catch (error) {
      console.log(error)
    }
  }

  async function handleClick() {
    await getImage()
    clickCount++
  }

  $: {
    if (clickCount >= 5) {
      buttonText = 'No more for you...'
      buttonDisabled = true
    } else if (clickCount >= 3) {
      buttonText = 'What was wrong with the last one?'
    } else if (clickCount >= 1) {
      buttonText = 'Get another random image!'
    }
  }

  scrollToTop()
</script>

<style>

</style>

<div class="page-content">
  <div class="d-flex justify-content-center m-4">
    <button
      type="button"
      class="btn btn-outline-dark {buttonDisabled ? 'disabled' : ''}"
      on:click={handleClick}
      disabled={buttonDisabled || undefined}>
      {buttonText}
    </button>
  </div>
  {#if src}
    {#if !buttonDisabled}
      <div class="d-flex justify-content-center m-2">
        Photo by &nbsp;
        <a
          href="{portfolio}?utm_source=Jane-Benson&utm_medium=referral"
          target="_blank">
          {author}
        </a>
        &nbsp; on &nbsp;
        <a
          href="https://unsplash.com/?utm_source=Jane-Benson&utm_medium=referral"
          target="_blank">
          Unsplash
        </a>
      </div>
      <div class="d-flex justify-content-center">
        <img {src} alt="alt-text" class="img-thumbnail" />
      </div>
    {:else}
      <div class="d-flex justify-content-center m-2">
        <img
          src="/imgs/fail.jpg"
          alt=""
          class="img-thumbnail"
          style="height: 600px; width: 600px;" />
      </div>
    {/if}
  {/if}
  <About {aboutData} } />
</div>
