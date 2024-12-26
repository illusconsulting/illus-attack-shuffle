<template>
      <div ref="menu" :class="{ 'menu': true, 'collapsed': isCollapsed }" :style="{ width: isCollapsed ? '2vw' : '12vw' }">
        <div class="menu-toggle" @click="toggleMenu">
          &#9776;
        </div>
        <div class="menu-content" :style="{ display: isCollapsed ? 'none' : 'block' }">
          <a href="#" @click.prevent="selectComponent('emulation')">Emulation Plans</a>
          <a href="#" @click.prevent="selectComponent('visualization')">ATT&CK Visualizations</a>
        </div>
      </div>
    </template>

    <script>
    export default {
      emits: ['select-component', 'toggle-menu'],
      props: {
        isCollapsed: {
          type: Boolean,
          default: true
        }
      },
      methods: {
        toggleMenu() {
          this.$emit('toggle-menu');
        },
        selectComponent(component) {
          this.$emit('select-component', component);
        }
      }
    };
    </script>

    <style scoped>
    .menu {
      position: fixed;
      top: 0;
      left: 0;
      background-color: #f0f0f0;
      padding: 4px;
      transition: width 0.3s ease-in-out;
      z-index: 100;
      overflow: hidden;
      height: 100%;
      box-shadow: 2px 0 5px rgba(0, 0, 0, 0.2);
    }

    .menu.collapsed {
      width: 2vw;
    }

    .menu:not(.collapsed) {
      width: 12vw;
    }

    .menu-toggle {
      cursor: pointer;
      font-size: 20px;
      padding: 4px;
    }

    .menu-content {
      padding: 4px;
    }

    .menu-content a {
      display: block;
      margin-bottom: 12px;
			margin-top: 12px;
      cursor: pointer;
    }
    </style>
