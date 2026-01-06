<script setup lang="ts">
definePageMeta({
  layout: 'auth',
  middleware: 'guest',
})

const { register } = useAuth()
const router = useRouter()

const loading = ref(false)
const form = reactive({
  username: '',
  email: '',
  password: '',
})
const errors = reactive({
  username: '',
  email: '',
  password: '',
})

const passwordValidation = computed(() => ({
  minLength: form.password.length >= 8,
  hasUppercase: /[A-Z]/.test(form.password),
  hasLowercase: /[a-z]/.test(form.password),
  hasNumber: /\d/.test(form.password),
  hasSpecial: /[@.$!%*?&]/.test(form.password),
}))

const isPasswordValid = computed(() => {
  return Object.values(passwordValidation.value).every(v => v === true)
})

async function handleSubmit() {
  errors.username = ''
  errors.email = ''
  errors.password = ''

  if (!form.username) {
    errors.username = 'nom utilisateur requis'
    return
  }
  if (!form.email) {
    errors.email = 'email requis'
    return
  }
  if (!form.password) {
    errors.password = 'mot de passe requis'
    return
  }

  if (!isPasswordValid.value) {
    errors.password = 'le mot de passe ne respecte pas tous les criteres'
    return
  }

  loading.value = true

  try {
    const success = await register(form)

    if (success) {
      router.push('/dashboard')
    }
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="min-h-screen flex items-center justify-center px-4">
    <UICard class="w-full max-w-md">
      <template #header>
        <h1 class="text-2xl font-bold text-center">Créer un compte</h1>
      </template>

      <form @submit.prevent="handleSubmit" class="space-y-4">
        <UIInput
          v-model="form.username"
          type="text"
          label="nom utilisateur"
          placeholder="johndoe"
          required
          :error="errors.username"
        />

        <UIInput
          v-model="form.email"
          type="email"
          label="Email"
          placeholder="vous@exemple.com"
          required
          :error="errors.email"
        />

        <UIInput
          v-model="form.password"
          type="password"
          label="Mot de passe"
          placeholder="••••••••"
          required
          :error="errors.password"
        />

        <!-- Indicateurs de validation du mot de passe -->
        <div v-if="form.password" class="space-y-2">
          <p class="text-sm font-medium text-gray-700">Le mot de passe doit contenir :</p>
          <div class="space-y-1">
            <div class="flex items-center gap-2 text-sm">
              <span v-if="passwordValidation.minLength" class="text-green-600">✓</span>
              <span v-else class="text-gray-400">○</span>
              <span :class="passwordValidation.minLength ? 'text-green-600' : 'text-gray-600'">
                Au moins 8 caractères
              </span>
            </div>
            <div class="flex items-center gap-2 text-sm">
              <span v-if="passwordValidation.hasUppercase" class="text-green-600">✓</span>
              <span v-else class="text-gray-400">○</span>
              <span :class="passwordValidation.hasUppercase ? 'text-green-600' : 'text-gray-600'">
                Une lettre majuscule (A-Z)
              </span>
            </div>
            <div class="flex items-center gap-2 text-sm">
              <span v-if="passwordValidation.hasLowercase" class="text-green-600">✓</span>
              <span v-else class="text-gray-400">○</span>
              <span :class="passwordValidation.hasLowercase ? 'text-green-600' : 'text-gray-600'">
                Une lettre minuscule (a-z)
              </span>
            </div>
            <div class="flex items-center gap-2 text-sm">
              <span v-if="passwordValidation.hasNumber" class="text-green-600">✓</span>
              <span v-else class="text-gray-400">○</span>
              <span :class="passwordValidation.hasNumber ? 'text-green-600' : 'text-gray-600'">
                Un chiffre (0-9)
              </span>
            </div>
            <div class="flex items-center gap-2 text-sm">
              <span v-if="passwordValidation.hasSpecial" class="text-green-600">✓</span>
              <span v-else class="text-gray-400">○</span>
              <span :class="passwordValidation.hasSpecial ? 'text-green-600' : 'text-gray-600'">
                Un caractère spécial (.@$!%*?&)
              </span>
            </div>
          </div>
        </div>

        <UIButton
          type="submit"
          variant="primary"
          size="lg"
          :loading="loading"
          class="w-full"
        >
          S'inscrire
        </UIButton>
      </form>

      <template #footer>
        <p class="text-sm text-center text-gray-600">
          Déjà un compte ?
          <NuxtLink to="/login" class="text-primary-600 hover:text-primary-700 font-medium">
            Se connecter
          </NuxtLink>
        </p>
      </template>
    </UICard>
  </div>
</template>


