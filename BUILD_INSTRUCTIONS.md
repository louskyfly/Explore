# Build APK Android - Explore

## Étape 1 : Créer un compte Expo (gratuit)

1. Va sur **https://expo.dev/signup**
2. Crée un compte (email + mot de passe)
3. Vérifie ton email

## Étape 2 : Installer EAS CLI

```bash
npm install -g eas-cli
```

## Étape 3 : Se connecter

```bash
cd "C:\Users\Lucas\Documents\Default Project\Explore"
eas login
```
(Entre ton email et mot de passe Expo)

## Étape 4 : Configurer le build

Je crée le fichier `eas.json` automatiquement.

## Étape 5 : Lancer le build APK

```bash
eas build -p android --profile preview
```

Le build prend ~10-15 minutes. Tu recevras un **lien de téléchargement** par email.

## Étape 6 : Installer l'APK

1. Transfère le fichier `.apk` sur ton téléphone
2. Ouvre le fichier → "Installer"
3. Accepte l'installation depuis les sources inconnues
4. L'app est sur ton écran d'accueil, 100% hors ligne !

---

**Note** : La première fois, Expo demande de vérifier ton email pour les builds Android.
