<script setup>
const { locale } = useI18n()
const switchLocalePath = useSwitchLocalePath()
</script>

<template>
  <div>
    <form>
      <select v-model="locale">
        <option value="en">
          <NuxtLink  :to="switchLocalePath('en')">
            English
          </NuxtLink>
        </option>
        <option value="de">
          <NuxtLink  :to="switchLocalePath('de')">
            German
          </NuxtLink>
        </option>
      </select>
      <p>{{ $t('welcome') }}</p>
    </form>
  </div>
</template>
