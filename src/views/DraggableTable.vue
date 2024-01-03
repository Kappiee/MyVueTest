<template>
    <div class="row">
      <div class="col-8">
        <h3>Nested draggable</h3>
        <nested-draggable :tasks="list" />
      </div>
  
    </div>
  </template>
  
  <script lang="ts">
  import nestedDraggable from "@/components/Nested.vue";
  export default {
    name: "nested-example",
    components: {
      nestedDraggable
    },
    data() {
      return {
        list: [
          {
            name: "task 1",
            tasks: [
              {
                name: "task 2",
                tasks: []
              }
            ]
          },
          {
            name: "task 3",
            tasks: [
              {
                name: "task 4",
                tasks: []
              }
            ]
          },
          {
            name: "task 5",
            tasks: []
          }
        ]
      };
    }
  };
  </script>
  <style scoped></style>
