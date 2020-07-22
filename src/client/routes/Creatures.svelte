<script>
  const creatures = [
    {
      name: 'Ruby Hopper',
      age: 4,
      species: 'Rabbit',
      breed: 'Havana',
      color: 'Black',
      occupation: 'Professional Salad Taster',
      picture: '/imgs/ruby.png'
    },
    {
      name: 'Paz Hopper',
      age: 5,
      species: 'Rabbit',
      breed: 'Mix',
      color: 'Multi',
      occupation: 'Bunstruction Worker',
      picture: '/imgs/paz.png'
    },
    {
      name: 'Barnacle',
      age: 0.5,
      species: 'Hamster',
      breed: 'Dwarf',
      color: 'Gray',
      occupation: 'Wheel Runner',
      picture: '/imgs/barnacle.jpg'
    }
  ]
</script>

<style>
  img {
    height: 250px;
    width: 250px;
  }
</style>

{#each creatures as creature, i}
  <img src={creature.picture} alt="" />
  <div class="creature">
    <h1>{creature.name}</h1>
    <ul>
      <li>
        <b>Age:</b>
        {creature.age}
      </li>
      <li>
        <b>Species:</b>
        {creature.species}
      </li>
      <li>
        <b>Breed:</b>
        {creature.breed}
      </li>
      <li>
        <b>Color:</b>
        {creature.color}
      </li>
      <li>
        <b>Occupation:</b>
        {creature.occupation}
      </li>

    </ul>
  </div>
{/each}
