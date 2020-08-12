<script>
  import { fade, fly } from 'svelte/transition'

  import AboutModal from './AboutModal.svelte'

  export let aboutData = {
    title: 'Project name here',
    content: 'Lots of content about project here',
    link: '/'
  }

  let showModal = false

  function toggleExpand() {
    showModal = !showModal
  }
</script>

<style>
  i {
    font-size: 60px;
    right: 12px;
    bottom: 12px;
    position: fixed;
    color: #ff4e50;
    z-index: 1;
  }
  .badge {
    margin: 2px;
    font-size: 12px;
  }
</style>

<div>

  <a on:click|preventDefault={toggleExpand} href="/">
    <i class={showModal ? 'fa fa-chevron-circle-down' : 'fa fa-info-circle'} />
  </a>

  <AboutModal bind:showModal>
    <span slot="title">{aboutData.title}</span>
    <span slot="body">
      <div class="f16">
        {@html aboutData.summary}
      </div>
      <div class="tags mt-2">
        {#each aboutData.tags as tag}
          <span class="badge badge-dark">{tag}</span>
        {/each}
      </div>
    </span>
    <span slot="footer">
      <a href={aboutData.link} target="_blank">See the code</a>
    </span>
  </AboutModal>

</div>
