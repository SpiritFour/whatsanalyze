<template>
  <section class="container card">

    <Polygon class="relative"/>

    <div class="text-4xl md:text-6xl font-extrabold mb-6 tracking-tight z-10">
      Get Your WhatsApp Wrapped.
      <div class="text-orange-500 italic">now.</div>
    </div>


    <div class="flex items-center justify-center w-full relative">
      <label
          class="flex flex-col items-center justify-center w-full h-64 border-2 border-dashed rounded-lg cursor-pointer hover:bg-gray-800 bg-gray-700  border-gray-600 hover:border-gray-500 "
          for="dropzone-file">
        <div class="flex flex-col items-center justify-center pt-5 pb-6">
          <svg aria-hidden="true" class="w-8 h-8 mb-4 text-gray-400"
               fill="none" viewBox="0 0 20 16" xmlns="http://www.w3.org/2000/svg">
            <path
                d="M13 13h3a3 3 0 0 0 0-6h-.025A5.56 5.56 0 0 0 16 6.5 5.5 5.5 0 0 0 5.207 5.021C5.137 5.017 5.071 5 5 5a4 4 0 0 0 0 8h2.167M10 15V6m0 0L8 8m2-2 2 2"
                stroke="currentColor" stroke-linecap="round" stroke-linejoin="round"
                stroke-width="2"/>
          </svg>
          <p class="mb-2 text-sm  text-gray-400"><span class="font-semibold">Click to upload</span> or
            drag and drop your WhatsApp export.</p>
          <p class="text-xs text-gray-400">SVG, PNG, JPG or GIF (MAX. 800x400px)</p>
        </div>
        <input id="dropzone-file" accept=".txt,.zip" class="hidden" type="file"
               @change="e => {isLoading = true;handleFile(e)}"/>
      </label>
    </div>

    <div v-if="isLoading" class="bg-blue-500">
      <pre>Loading...</pre>
    </div>

    <div v-if="workerResponse?.state === 'ERROR'" class="bg-red-500">
      <pre>{{ workerResponse?.response.message }}</pre>
    </div>

  </section>
</template>

<script lang="ts" setup>
const workerResponse = ref(null);
const isLoading = ref(false);


const handleFile = (e: Event): Promise<void> => {
  return new Promise((resolve, reject) => {

    const input = e.target as HTMLInputElement;
    if (!input.files || !input.files.length) return;
    const file = input.files[0];

    const worker = new Worker('/worker/fileWorker.js')

    worker.postMessage({file});

    worker.onmessage = ({data}) => {
      if (data) {
        workerResponse.value = data;

        if (data.state === 'DONE' || data.state === 'ERROR') {
          isLoading.value = false;
          worker.terminate()

          if (data.state === 'DONE') {

            sessionStorage.setItem("stats", JSON.stringify(data.response));

            navigateTo({
              path: '/results',
            })
          }

          resolve()
        }
      }
    }
  })
}
</script>
