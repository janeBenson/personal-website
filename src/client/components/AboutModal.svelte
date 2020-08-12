<script>
  import { fade, fly } from 'svelte/transition'

  export let canCloseModal = () => true
  export let showModal

  function toggleModal() {
    showModal = !showModal
  }

  function handleClose() {
    if (canCloseModal()) {
      toggleModal()
    }
    return
  }
</script>

<style>
  .card {
    position: fixed;
    bottom: 80px;
    right: 12px;
    width: 25%;
    border: none;
  }
  .card-header {
    color: white;
    background-color: #ff6f61;
  }
  .card-body {
    max-height: 60vh;
  }
  /* Modal color*/
  .card,
  .card-footer {
    background-color: #f8f8ff;
  }
</style>

{#if showModal}
  <div class="card-wrapper">
    <div class="card shadow" transition:fly={{ y: 200, duration: 500 }}>
      <div class="card-header text-center p-3">
        <h5>
          <slot name="title">Image Generator Project</slot>
        </h5>
      </div>
      <div class="card-body overflow-auto">
        <slot name="body">
          Contrary to popular belief, Lorem Ipsum is not simply random text. It
          has roots in a piece of classical Latin literature from 45 BC, making
          it over 2000 years old. Richard McClintock, a Latin professor at
          Hampden-Sydney College in Virginia, looked up one of the more obscure
          Latin words, consectetur, from a Lorem Ipsum passage, and going
          through the cites of the word in classical literature, discovered the
          undoubtable source. Lorem Ipsum comes from sections 1.10.32 and
          1.10.33 of "de Finibus Bonorum et Malorum" (The Extremes of Good and
          Evil) by Cicero, written in 45 BC. This book is a treatise on the
          theory of ethics, very popular during the Renaissance. The first line
          of Lorem Ipsum, "Lorem ipsum dolor sit amet..", comes from a line in
          section 1.10.32. The standard chunk of Lorem Ipsum used since the
          1500s is reproduced below for those interested. Sections 1.10.32 and
          1.10.33 from "de Finibus Bonorum et Malorum" by Cicero are also
          reproduced in their exact original form, accompanied by English
          versions from the 1914 translation by H. Rackham. Contrary to popular
          belief, Lorem Ipsum is not simply random text. It has roots in a piece
          of classical Latin literature from 45 BC, making it over 2000 years
          old. Richard McClintock, a Latin professor at Hampden-Sydney College
          in Virginia, looked up one of the more obscure Latin words,
          consectetur, from a Lorem Ipsum passage, and going through the cites
          of the word in classical literature, discovered the undoubtable
          source. Lorem Ipsum comes from sections 1.10.32 and 1.10.33 of "de
          Finibus Bonorum et Malorum" (The Extremes of Good and Evil) by Cicero,
          written in 45 BC. This book is a treatise on the theory of ethics,
          very popular during the Renaissance. The first line of Lorem Ipsum,
          "Lorem ipsum dolor sit amet..", comes from a line in section 1.10.32.
          The standard chunk of Lorem Ipsum used since the 1500s is reproduced
          below for those interested. Sections 1.10.32 and 1.10.33 from "de
          Finibus Bonorum et Malorum" by Cicero are also reproduced in their
          exact original form, accompanied by English versions from the 1914
          translation by H. Rackham.
        </slot>
      </div>
      <div class="card-footer text-center">
        <slot name="footer">See the code</slot>
      </div>
    </div>
  </div>
{/if}
