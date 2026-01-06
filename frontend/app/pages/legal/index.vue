<script setup lang="ts">
const currentYear = new Date().getFullYear();
</script>

<template>
  <main class="min-h-screen">
    <section class="mx-auto max-w-5xl px-4 py-10 md:py-14">
      <!-- Header -->
      <header class="mb-8 md:mb-10">
        <p class="text-xs uppercase tracking-widest text-purple-400 mb-1">
          <mark
            class="bg-white/70 rounded-sm text-purple-400 px-1 dark:bg-slate-900/70 dark:text-purple-400"
            >Informations légales</mark
          >
        </p>

        <h1 class="text-3xl md:text-4xl font-semibold text-slate-800 dark:text-slate-100">
          Mentions légales – AideFlash
        </h1>
        <p class="mt-3 max-w-2xl text-sm md:text-base text-slate-500 dark:text-slate-400">
          Cette page a pour objectif de vous informer de manière transparente sur l’éditeur du site,
          son hébergeur, la gestion des données personnelles et les conditions d’utilisation de la
          plateforme communautaire AideFlash.
        </p>
      </header>

      <div
        class="rounded-3xl border border-purple-100/30 bg-white/40 shadow-sm backdrop-blur-sm p-5 md:p-8 space-y-8 text-sm md:text-[15px] text-slate-700 leading-relaxed dark:text-slate-300 dark:bg-slate-800/40 dark:border-purple-900/30"
      >
        <!-- 1. Éditeur du site -->
        <section>
          <h2 class="text-base md:text-lg font-semibold text-slate-900 dark:text-slate-100 mb-2">
            1. Éditeur du site
          </h2>
          <p>Le site <span class="font-semibold">AideFlash</span> est édité par :</p>
          <ul class="mt-2 space-y-1">
            <li><span class="font-medium">Dénomination sociale :</span> [AideFlash SAS]</li>
            <li>
              <span class="font-medium">Forme juridique :</span> [SAS au capital de
              XX&nbsp;XXX&nbsp;€]
            </li>
            <li>
              <span class="font-medium">Siège social :</span> [Adresse complète, code postal, ville,
              pays]
            </li>
            <li><span class="font-medium">RCS :</span> [Ville] – [Numéro RCS / SIREN]</li>
            <li><span class="font-medium">N° TVA intracommunautaire :</span> [FRXX XXX XXX XXX]</li>
            <li><span class="font-medium">Téléphone :</span> [numéro]</li>
            <li><span class="font-medium">E-mail :</span> [contact@aideflash.fr]</li>
          </ul>
          <p class="mt-2">
            <span class="font-medium">Directeur de la publication :</span>
            [Nom et prénom du responsable légal].
          </p>
        </section>

        <!-- 2. Hébergeur -->
        <section>
          <h2 class="text-base md:text-lg font-semibold text-slate-900 dark:text-slate-100 mb-2">
            2. Hébergement du site
          </h2>
          <p>Le site AideFlash est hébergé par :</p>
          <ul class="mt-2 space-y-1">
            <li><span class="font-medium">Raison sociale :</span> [Nom de l’hébergeur]</li>
            <li><span class="font-medium">Adresse :</span> [Adresse complète de l’hébergeur]</li>
            <li><span class="font-medium">Site web :</span> [https://…](https://…)</li>
            <li><span class="font-medium">Téléphone :</span> [numéro]</li>
          </ul>
        </section>

        <!-- 3. Objet du site -->
        <section>
          <h2 class="text-base md:text-lg font-semibold text-slate-900 dark:text-slate-100 mb-2">
            3. Objet du site
          </h2>
          <p>
            AideFlash est une plateforme communautaire permettant aux utilisateurs de publier,
            consulter et partager des tips, questions et réponses autour de sujets variés
            (développement, tech, vie quotidienne, etc.), avec un système de gamification, de cartes
            interactives et de fonctionnalités sociales.
          </p>
        </section>

        <!-- 4. Accès et comptes -->
        <section>
          <h2 class="text-base md:text-lg font-semibold text-slate-900 dark:text-slate-100 mb-2">
            4. Accès au service et comptes utilisateurs
          </h2>
          <p>
            L’accès au site est possible gratuitement pour tout visiteur disposant d’une connexion
            Internet et d’un navigateur récent. Certaines fonctionnalités (publication de tips,
            commentaires, messagerie privée, gamification) nécessitent la création d’un compte
            utilisateur.
          </p>
          <p class="mt-2">
            L’utilisateur s’engage à fournir des informations exactes lors de son inscription et à
            maintenir la confidentialité de ses identifiants. Tout usage frauduleux ou non conforme
            aux lois et aux présentes mentions peut entraîner la suspension ou la suppression du
            compte.
          </p>
        </section>

        <!-- 5. Propriété intellectuelle -->
        <section>
          <h2 class="text-base md:text-lg font-semibold text-slate-900 dark:text-slate-100 mb-2">
            5. Propriété intellectuelle
          </h2>
          <p>
            L’ensemble des éléments graphiques et techniques du site (charte graphique, logo, design
            de l’interface, code front et back, etc.) est protégé par le droit de la propriété
            intellectuelle et reste la propriété exclusive de l’éditeur ou de ses partenaires.
          </p>
          <p class="mt-2">
            Les contenus publiés par les utilisateurs (tips, commentaires, questions) restent leur
            propriété, mais ils concèdent à AideFlash une licence non exclusive, mondiale et
            gratuite pour les héberger, les afficher et les distribuer sur la plateforme, dans le
            strict cadre du service.
          </p>
        </section>

        <!-- 6. Contenus et modération -->
        <section>
          <h2 class="text-base md:text-lg font-semibold text-slate-900 dark:text-slate-100 mb-2">
            6. Contenus, responsabilité et modération
          </h2>
          <p>
            Les utilisateurs sont seuls responsables des contenus qu’ils publient (tips, messages,
            commentaires). Ils s’engagent à respecter la législation en vigueur et à ne pas diffuser
            de contenus illicites, diffamatoires, discriminatoires, haineux, violents,
            pornographiques ou portant atteinte aux droits de tiers.
          </p>
          <p class="mt-2">
            AideFlash met en place un système de signalement et une équipe de modération pouvant
            supprimer des contenus, limiter des comptes ou prononcer des sanctions en cas de
            non-respect des règles. L’éditeur ne peut être tenu responsable des contenus publiés par
            les utilisateurs, mais s’engage à intervenir dans des délais raisonnables après
            signalement.
          </p>
        </section>

        <!-- 7. Données personnelles & cookies -->
        <section>
          <h2 class="text-base md:text-lg font-semibold text-slate-900 dark:text-slate-100 mb-2">
            7. Données personnelles &amp; cookies
          </h2>
          <p>
            Dans le cadre de l’utilisation d’AideFlash, certaines données personnelles (identité,
            coordonnées, données de connexion, contenus publiés, préférences) peuvent être
            collectées pour le fonctionnement du service, la sécurité des comptes, la lutte contre
            la fraude, la personnalisation de l’expérience et les statistiques d’usage, conformément
            au Règlement (UE) 2016/679 (RGPD) et à la loi Informatique et Libertés.
          </p>
          <p class="mt-2">
            Une politique de confidentialité détaillée précise la nature des données collectées, les
            finalités de traitement, la durée de conservation, ainsi que vos droits (accès,
            rectification, opposition, effacement, limitation, portabilité). Vous pouvez l consulter
            à tout moment sur la page
            <span class="font-medium">« Politique de confidentialité »</span>.
          </p>
          <p class="mt-2">
            Le site peut utiliser des cookies et technologies similaires à des fins de mesure
            d’audience, de sécurité, de personnalisation et de publicité. Vous pouvez gérer vos
            préférences via le bandeau cookies ou les paramètres de votre navigateur.
          </p>
          <p class="mt-2">
            Pour exercer vos droits ou toute question concernant vos données, vous pouvez contacter
            le délégué à la protection des données (DPO) à l’adresse suivante :
            <span class="font-medium">[dpo@aideflash.fr]</span>.
          </p>
        </section>

        <!-- 8. Liens externes -->
        <section>
          <h2 class="text-base md:text-lg font-semibold text-slate-900 dark:text-slate-100 mb-2">
            8. Liens hypertextes
          </h2>
          <p>
            Le site peut contenir des liens vers des sites tiers. AideFlash ne dispose d’aucun
            contrôle sur ces ressources externes et ne peut être tenue responsable de leur contenu,
            de leur disponibilité ou de tout dommage pouvant résulter de leur consultation.
          </p>
        </section>

        <!-- 9. Droit applicable -->
        <section>
          <h2 class="text-base md:text-lg font-semibold text-slate-900 dark:text-slate-100 mb-2">
            9. Droit applicable et juridiction compétente
          </h2>
          <p>
            Les présentes mentions légales sont soumises au droit français. En cas de litige, et à
            défaut de résolution amiable, les tribunaux compétents du ressort du siège social de
            l’éditeur seront seuls compétents, sous réserve des dispositions légales impératives
            protectrices du consommateur.
          </p>
        </section>

        <!-- 10. Mise à jour -->
        <section>
          <h2 class="text-base md:text-lg font-semibold text-slate-900 dark:text-slate-100 mb-2">
            10. Mise à jour des mentions légales
          </h2>
          <p>
            L’éditeur se réserve le droit de modifier les présentes mentions légales à tout moment,
            notamment pour les adapter à l’évolution du site, des services proposés ou de la
            réglementation en vigueur. La date de dernière mise à jour figure ci-dessous.
          </p>
          <p class="mt-2 text-xs text-slate-500">
            Dernière mise à jour : [date à compléter] – © {{ currentYear }} AideFlash.
          </p>
        </section>
      </div>
    </section>
  </main>
</template>
