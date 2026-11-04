---
title: "Comment exporter une discussion WhatsApp"
description: "Pas à pas sur iPhone, Android, WhatsApp Web, Windows et Mac, pour les discussions individuelles et de groupe, avec ou sans photos. Ouvrez ensuite le fichier ici même."
---

WhatsApp peut enregistrer n'importe quelle discussion, individuelle ou de groupe, sous forme de fichier : une copie texte de tous les messages avec leur date, leur heure et leur expéditeur, et, si vous le souhaitez, les photos et autres médias. Voici comment faire sur chaque appareil, et ce que vous pouvez faire du fichier ensuite.

## [Sur iPhone]{#iphone}

1. Ouvrez la discussion ou le groupe à exporter.
2. Appuyez sur le nom du contact ou du groupe, en haut.
3. Faites défiler vers le bas et appuyez sur **Exporter la discussion**.
4. Si la discussion contient des photos ou d'autres médias, choisissez **Sans médias**, **Avec tous les médias** ou **Avec les médias sélectionnés…**.
5. Choisissez où va le fichier : **Enregistrer dans Fichiers** › **Sur mon iPhone** le garde sur votre téléphone ; par Mail ou Messages, vous vous l'envoyez.

WhatsApp regroupe tout dans un seul fichier ZIP. Ne le décompressez pas : WhatsAnalyze ouvre le ZIP tel quel.

## [Sur Android]{#android}

1. Ouvrez la discussion ou le groupe.
2. Appuyez sur **⋮** en haut à droite, puis sur **Plus** › **Exporter la discussion**.
3. Choisissez **Sans médias** ou **Joindre médias**.
4. Choisissez où l'envoyer : Gmail, Google Drive, Quick Share ou une autre application. Si vous avez ajouté WhatsAnalyze à votre écran d'accueil, il figure dans cette liste et ouvre la discussion aussitôt.

## [Sur ordinateur : WhatsApp Web, Windows et Mac]{#computer}

WhatsApp Web et l'application Windows savent aussi exporter les discussions :

1. Ouvrez la discussion ou le groupe.
2. Cliquez sur **⋮** › **Exporter la discussion**.
3. Choisissez **Tous les messages**, ou **Période personnalisée** pour n'exporter qu'une partie de la discussion.
4. Cliquez sur **Exporter**.

Vous obtenez un fichier ZIP avec le texte seul : WhatsApp Web et Windows laissent de côté les photos et autres médias, ainsi que les messages à vue unique et les messages éphémères. Si **Exporter la discussion** n'apparaît pas dans le menu, mettez WhatsApp à jour ou rechargez WhatsApp Web, ou exportez la discussion depuis votre téléphone.

L'application Mac fonctionne comme l'iPhone : cliquez sur le nom du contact ou du groupe, puis sur **Exporter la discussion**, et choisissez d'inclure ou non les médias.

## Avec ou sans médias ?

- **Sans médias**, c'est plus rapide et plus léger, et cela suffit pour les statistiques, la lecture par IA et un PDF du texte.
- **Avec médias**, les photos, vidéos et autres fichiers sont ajoutés. Choisissez cette option si votre PDF doit montrer les images, ou pour le PDF de preuve judiciaire, qui répertorie chaque pièce jointe avec sa propre empreinte.

**Y a-t-il une limite ?** La page d'aide de WhatsApp indiquait autrefois qu'un export avec médias contient au maximum les 10 000 derniers messages, et 40 000 sans médias, à cause de la taille maximale d'un e-mail. La page actuelle ne mentionne plus de limite. Si un export avec médias semble commencer trop tard, exportez de nouveau la discussion sans médias.

## Ce que contient le fichier

- Un fichier texte avec tous les messages, leur date, leur heure et leur expéditeur. Sur iPhone, il s'appelle `_chat.txt` et se trouve dans le ZIP.
- Si vous avez inclus les médias : les photos et fichiers eux-mêmes, à côté du fichier texte.
- C'est une copie, pas une sauvegarde : WhatsApp ne peut pas la réimporter. Pour transférer vos discussions sur un nouveau téléphone, utilisez la sauvegarde de WhatsApp.
- Les messages à vue unique ne sont jamais exportés.

## [Exporter une discussion WhatsApp en PDF]{#pdf}

WhatsApp ne sait pas exporter en PDF. [Ouvrez votre export ici](#dropzone-slot) et WhatsAnalyze en fait un PDF :

- **PDF de la discussion** : toute la conversation, prête à imprimer ou à conserver, avec les photos si vous avez exporté avec les médias. L'aperçu est gratuit ; le PDF complet est un achat unique.
- **[PDF de preuve judiciaire](/fr/tools/court-evidence/)** : lignes numérotées, horodatages exacts, empreinte SHA-256 de votre export et liste des pièces, pour les avocats, les tribunaux et les autorités.

Les deux sont créés dans votre navigateur : votre discussion n'est pas envoyée sur un serveur.

## En cas de problème

- **« Exporter la discussion » n'apparaît pas** : mettez WhatsApp à jour. Sur iPhone, l'option se trouve tout en bas des infos du contact ou du groupe ; sur Android, sous ⋮ › **Plus**.
- **Vous avez un fichier qui se termine par .crypt14 ou .crypt15** : c'est la sauvegarde chiffrée de WhatsApp, qu'aucune autre application ne peut lire. Exportez plutôt la discussion comme indiqué ci-dessus.
- **WhatsAnalyze ne trouve aucun message** : déposez le ZIP ou le .txt tel que WhatsApp l'a créé, pas une capture d'écran, un PDF ou une sauvegarde.
