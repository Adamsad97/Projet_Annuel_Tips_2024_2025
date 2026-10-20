<script setup lang="ts">
import { ref, reactive } from 'vue';
import type { AdminBadge, AdminGrade } from '~/types';
import { API_ROUTES } from '~/config/api';

const api = useApi();
const toast = useToastMessage();

const grades = ref<AdminGrade[]>([]);
const badges = ref<AdminBadge[]>([]);
const newGrade = reactive({ name: '', xpRequired: 0 });
const saving = ref(false);

const load = async () => {
  try {
    [grades.value, badges.value] = await Promise.all([
      api.get<AdminGrade[]>(API_ROUTES.ADMIN.GRADES),
      api.get<AdminBadge[]>(API_ROUTES.ADMIN.BADGES),
    ]);
  } catch {
    // l'erreur est déjà affichée par useApi
  }
};

// Enregistre puis recharge (les grades des utilisateurs sont recalculés côté serveur)
const save = async (action: () => Promise<unknown>, message: string) => {
  saving.value = true;
  try {
    await action();
    toast.success(message);
    await load();
  } catch {
    // l'erreur est déjà affichée par useApi
  } finally {
    saving.value = false;
  }
};

const createGrade = () =>
  save(async () => {
    await api.post(API_ROUTES.ADMIN.GRADES, {
      name: newGrade.name.trim(),
      xpRequired: Number(newGrade.xpRequired),
    });
    newGrade.name = '';
    newGrade.xpRequired = 0;
  }, 'Grade créé');

const updateGrade = (grade: AdminGrade) =>
  save(
    () =>
      api.patch(API_ROUTES.ADMIN.GRADE(grade.id), {
        name: grade.name.trim(),
        xpRequired: Number(grade.xpRequired),
      }),
    'Grade mis à jour',
  );

const deleteGrade = (grade: AdminGrade) => {
  if (!confirm(`Supprimer le grade « ${grade.name} » ? Ses membres seront réaffectés.`)) return;
  return save(() => api.delete(API_ROUTES.ADMIN.GRADE(grade.id)), 'Grade supprimé');
};

const updateBadge = (badge: AdminBadge) =>
  save(
    () =>
      api.patch(API_ROUTES.ADMIN.BADGE(badge.id), {
        name: badge.name.trim(),
        description: badge.description?.trim() ?? '',
        icon: badge.icon.trim(),
        xpReward: Number(badge.xpReward),
      }),
    'Badge mis à jour',
  );

onMounted(load);
</script>

<template>
  <div class="space-y-10">
    <!-- Grades -->
    <section class="space-y-4">
      <div>
        <h3 class="text-lg font-bold text-slate-900 dark:text-white">Grades</h3>
        <p class="text-sm text-slate-500">
          Un membre obtient le grade le plus élevé dont le seuil d'XP est atteint. Modifier les
          seuils réaffecte automatiquement tous les membres.
        </p>
      </div>
      <div class="overflow-x-auto rounded-2xl bg-white/70 dark:bg-slate-800/60">
        <table class="w-full text-sm">
          <thead>
            <tr class="text-left text-xs text-slate-500 uppercase">
              <th class="p-3">Nom</th>
              <th class="p-3">XP requise</th>
              <th class="p-3 text-right">Membres</th>
              <th class="p-3" />
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="grade in grades"
              :key="grade.id"
              class="border-t border-slate-100 dark:border-slate-700"
            >
              <td class="p-2">
                <input
                  v-model="grade.name"
                  class="w-full px-2 py-1 rounded-lg border dark:bg-slate-900 dark:border-slate-700"
                />
              </td>
              <td class="p-2">
                <input
                  v-model.number="grade.xpRequired"
                  type="number"
                  min="0"
                  class="w-28 px-2 py-1 rounded-lg border dark:bg-slate-900 dark:border-slate-700"
                />
              </td>
              <td class="p-2 text-right tabular-nums">{{ grade._count.users }}</td>
              <td class="p-2 text-right whitespace-nowrap space-x-3 text-xs font-bold">
                <button
                  class="text-purple-600 hover:underline"
                  :disabled="saving"
                  @click="updateGrade(grade)"
                >
                  Enregistrer
                </button>
                <button
                  class="text-red-500 hover:underline"
                  :disabled="saving"
                  @click="deleteGrade(grade)"
                >
                  Supprimer
                </button>
              </td>
            </tr>
            <tr
              class="border-t border-slate-100 dark:border-slate-700 bg-purple-50/40 dark:bg-purple-900/10"
            >
              <td class="p-2">
                <input
                  v-model="newGrade.name"
                  placeholder="Nouveau grade"
                  class="w-full px-2 py-1 rounded-lg border dark:bg-slate-900 dark:border-slate-700"
                />
              </td>
              <td class="p-2">
                <input
                  v-model.number="newGrade.xpRequired"
                  type="number"
                  min="0"
                  class="w-28 px-2 py-1 rounded-lg border dark:bg-slate-900 dark:border-slate-700"
                />
              </td>
              <td />
              <td class="p-2 text-right">
                <button
                  class="text-xs font-bold text-purple-600 hover:underline disabled:opacity-50"
                  :disabled="saving || newGrade.name.trim().length < 2"
                  @click="createGrade"
                >
                  Ajouter
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>

    <!-- Badges -->
    <section class="space-y-4">
      <div>
        <h3 class="text-lg font-bold text-slate-900 dark:text-white">Badges</h3>
        <p class="text-sm text-slate-500">
          Les conditions d'obtention sont définies dans le code ; vous pouvez modifier le nom,
          l'icône, la description et l'XP gagnée.
        </p>
      </div>
      <div class="grid md:grid-cols-2 gap-4">
        <div
          v-for="badge in badges"
          :key="badge.id"
          class="rounded-2xl bg-white/70 dark:bg-slate-800/60 p-4 space-y-2"
        >
          <div class="flex items-center gap-2">
            <input
              v-model="badge.icon"
              maxlength="10"
              class="w-14 text-center text-2xl px-1 py-1 rounded-lg border dark:bg-slate-900 dark:border-slate-700"
            />
            <input
              v-model="badge.name"
              class="flex-1 px-2 py-1 rounded-lg border font-bold dark:bg-slate-900 dark:border-slate-700"
            />
          </div>
          <input
            v-model="badge.description"
            placeholder="Description"
            class="w-full px-2 py-1 rounded-lg border text-sm dark:bg-slate-900 dark:border-slate-700"
          />
          <div class="flex items-center justify-between gap-2 text-sm">
            <label class="flex items-center gap-2">
              XP
              <input
                v-model.number="badge.xpReward"
                type="number"
                min="0"
                class="w-24 px-2 py-1 rounded-lg border dark:bg-slate-900 dark:border-slate-700"
              />
            </label>
            <span class="text-xs text-slate-400"
              >{{ badge.code }} · {{ badge._count.userBadges }} obtenu(s)</span
            >
            <button
              class="text-xs font-bold text-purple-600 hover:underline"
              :disabled="saving"
              @click="updateBadge(badge)"
            >
              Enregistrer
            </button>
          </div>
        </div>
      </div>
    </section>
  </div>
</template>
