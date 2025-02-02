<template>
  <article id="gallery">
    <div class="progress"></div>
    <section class="slider-group-container">
      <div>
        <ul class="img-group">
          <li class="slider">
            <slot name="1" />
          </li>
          <li class="slider">
            <slot name="2" />
          </li>
          <li class="slider">
            <slot name="3" />
          </li>
          <li class="slider">
            <slot name="4" />
          </li>
          <li class="slider">
            <slot name="5" />
          </li>
        </ul>
      </div>
    </section>
  </article>
</template>

<script lang="ts" setup>
import { onMounted } from "vue";
import { animate, scroll } from "motion";

onMounted(() => {
  // Grab all items for horizontal slide calculation
  const items = document.querySelectorAll(".slider");
  // How far (in vw) we translate the .img-group horizontally
  // If you have 5 items, that becomes -400vw (since items.length=5 => 5-1=4 => -400vw).
  const translateDistance = -(items.length - 1) * 100;

  const container = document.querySelector(".slider-group-container");
  const scrollOptions = container ? { target: container } : undefined;

  // Animate the .img-group horizontally during scroll
  // Connect the scroll to .slider-group-container
  scroll(
    animate(".img-group", {
      transform: ["none", `translateX(${translateDistance}vw)`],
    }),
    scrollOptions,
  );

  // Animate .progress bar scaleX from 0 to 1
  scroll(animate(".progress", { scaleX: [0, 1] }), scrollOptions);
});
</script>

<style scoped>
#gallery {
  width: 98vw;
}

#gallery h3 {
  font-family: "JetBrains Mono", monospace;
}

#gallery header,
#gallery footer {
  height: 70vh;
  display: flex;
  justify-content: center;
  align-items: center;
}

.slider-group-container {
  height: 500vh;
  position: relative;
}

.slider-group-container > div {
  position: sticky;
  top: 0;
  overflow: hidden;
  height: 100vh;
}

.img-group {
  display: flex;
}

.slider {
  display: flex;
  width: 100vw;
  height: 100vh;
  flex: 0 0 auto;
  align-items: center;
  justify-content: center;
  flex-direction: column;
  overflow: hidden;
}

#gallery header h2 {
  font-size: 56px;
  font-weight: 700;
  letter-spacing: -3px;
  line-height: 1.2;
  text-align: center;
  margin: 0;
}

.slider h3 {
  margin: 0;
  font-size: 50px;
  font-weight: 700;
  letter-spacing: -3px;
  line-height: 1.2;
  position: relative;
  bottom: 30px;
  display: inline-block;
}

.slider img {
  width: 300px;
  height: 400px;
}

.progress {
  position: fixed;
  left: 0;
  right: 0;
  height: 5px;
  background: #9911ff;
  top: 100px;
  transform: scaleX(0);
  transform-origin: left center;
}
</style>
