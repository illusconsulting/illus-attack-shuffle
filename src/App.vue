<template>
      <div style="display: flex;">
        <Menu @select-component="selectComponent" :is-collapsed="isMenuCollapsed" @toggle-menu="toggleMenu" />
        <div :style="{ 'flex': 1, 'margin-left': isMenuCollapsed ? 'calc(6vw)' : 'calc(6vw)' }" @click="collapseMenu">
          <EmulationPlans v-if="selectedComponent === 'emulation'" style="flex: 1; margin-right: 4vw;" />
          <AttackMappingVisualization v-if="selectedComponent === 'visualization'" style="flex: 1; margin-right: 4vw;" />
        </div>
      </div>
    </template>

    <script>
    import Menu from './components/Menu.vue';
    import EmulationPlans from './components/EmulationPlans.vue';
    import AttackMappingVisualization from './components/AttackMappingVisualization.vue';

    export default {
      components: {
        Menu,
        EmulationPlans,
        AttackMappingVisualization
      },
      data() {
        return {
          selectedComponent: 'emulation',
          isMenuCollapsed: true
        };
      },
      methods: {
        toggleMenu() {
          this.isMenuCollapsed = !this.isMenuCollapsed;
        },
        collapseMenu(event) {
          if (!this.$refs.menu || !this.$refs.menu.$el.contains(event.target)) {
            this.isMenuCollapsed = true;
          }
        },
        selectComponent(component) {
          this.selectedComponent = component;
        }
      }
    };
    </script>
