<template>
    <div class="dropdown">
      <div class="dropdown-toggle" @click="toggleDropdown" :class="{ dark: darkMode }">
        {{ selectedObject ? selectedObject.display : 'Select object' }}
      </div>
      <div v-if="isOpen" class="dropdown-menu" :class="{ dark: darkMode }">
        <input
          type="text"
          v-model="searchQuery"
          placeholder="Search..."
          class="search-input"
          :class="{ dark: darkMode }"
          @input="filterObjects"
        />
        <ul class="dropdown-list" :class="{ dark: darkMode }">
          <li
            v-for="object in filteredObjects"
            :key="object.NAME"
            @click="selectObject(object)"
            class="dropdown-item"
            :class="{ dark: darkMode }"
          >
            {{ object.display }}
          </li>
        </ul>
      </div>
    </div>
  </template>
  
  <script>
  export default {
    props: ['objects', 'darkMode'],
    data() {
      return {
        searchQuery: '',
        filteredObjects: [],
        selectedObject: null,
        isOpen: false
      };
    },
    computed: {
      formattedObjects() {
        return this.objects.map(obj => ({
          display: `${obj.NAME} - RA: ${obj.RA} DEC: ${obj.DEC}`,
          ...obj
        }));
      }
    },
    methods: {
      filterObjects() {
        const query = this.searchQuery.toLowerCase();
        this.filteredObjects = this.formattedObjects.filter(obj =>
          obj.display.toLowerCase().includes(query)
        );
      },
      selectObject(object) {
        this.selectedObject = object;
        this.isOpen = false;
        this.$emit('select', object);
      },
      toggleDropdown() {
        this.isOpen = !this.isOpen;
        if (this.isOpen) {
          this.filteredObjects = this.formattedObjects;
        }
      }
    }
  };
  </script>
  
  <style scoped lang="scss">
  @import '../styles/main.scss';
  
  .dropdown {
    position: relative;
    width: 80vw;
    margin: 0 auto;
  }
  .dropdown-toggle {
    padding: 10px;
    border: 2px solid #ccc;
    background-color: #fff;
    cursor: pointer;
    text-align: center;
    border-radius: 5px;
    font-size: 16px;
    &.dark {
      background-color: #333;
      color: $dark-text;
      border: 2px solid $dark-text;
    }
  }
  .dropdown-menu {
    position: absolute;
    top: 100%;
    left: 0;
    width: 100%;
    border: 2px solid #ccc;
    background-color: #fff;
    z-index: 1000;
    border-radius: 5px;
    box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
    &.dark {
      background-color: #333;
      border: 2px solid $dark-text;
    }
  }
  .search-input {
    width: calc(100% - 20px);
    margin: 10px auto; /* Center the input */
    padding: 5px;
    display: block; /* Ensure it is block level */
    border: 2px solid #ccc;
    border-radius: 5px;
    &.dark {
      background-color: #333;
      color: $dark-text;
      border: 2px solid $dark-text;
    }
  }
  .dropdown-list {
    max-height: 200px; /* Set a fixed height for the list */
    overflow-y: auto; /* Enable vertical scrolling */
    margin: 0;
    padding: 0;
    list-style: none;
    &.dark {
      background-color: #333;
    }
  }
  .dropdown-item {
    padding: 10px;
    cursor: pointer;
    border-bottom: 1px solid #ccc;
    &:last-child {
      border-bottom: none;
    }
    &:hover {
      background-color: #f0f0f0;
      &.dark {
        background-color: #444;
      }
    }
    &.dark {
      color: $dark-text;
    }
  }
  </style>
  