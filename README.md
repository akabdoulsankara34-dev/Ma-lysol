# Guide de Fonctionnement de BizPilot Burkina Faso 🇧🇫

BizPilot BF est un SaaS de gestion commerciale, caisse enregistreuse, gestion de stocks, suivi des créances clients et impression thermique conçu spécifiquement pour les commerces, boutiques, quincailleries et PME au Burkina Faso.

---

## 1. Fonctionnement Multi-Entreprise & Connexion aux Comptes

Chaque entreprise dispose d'un espace sécurisé et isolé avec ses propres données (produits, ventes, stocks, créances, trésorerie).

### Comment chaque entreprise et ses collaborateurs se connectent :

1. **Accès via l'URL Web ou l'Application PWA** :
   - L'entreprise accède à son portail BizPilot depuis un smartphone, tablette ou ordinateur.
2. **Identification par Profil Collaborateur & Code PIN de Caisse** :
   - Lors de la première visite ou au changement de poste, le collaborateur sélectionne son compte dans la liste de l'entreprise (ou saisit son numéro de téléphone).
   - Il entre son **Code PIN à 4 chiffres** (ex: `0000` par défaut ou code attribué par le gérant).
3. **Rôles & Niveaux d'Accès** :
   - **Gérant / Propriétaire (`owner`)** : Accès complet (chiffre d'affaires, marge nette, coûts d'achats, suppression, gestion d'équipe et export).
   - **Gestionnaire de Stock (`stock_manager`)** : Gestion des entrées/sorties de stock, inventaire, réapprovisionnement, sans visibilité sur les bénéfices nets.
   - **Vendeur / Caissier (`cashier`)** : Point de vente (POS), encaissements (Cash, Orange Money, Moov Money, Wave/Coris), impression tickets, sans accès aux paramètres confidentiels.

---

## 2. Installation PWA & Fonctionnement 100% Hors-Ligne (Offline)

BizPilot BF est une **Progressive Web App (PWA)** avec synchronisation continue et cache local :

### Comment installer l'application sur Smartphone ou Ordinateur :
- **Sur Android / Chrome** : Cliquez sur les trois points du navigateur puis sur **« Ajouter à l'écran d'accueil »** ou **« Installer l'application »**.
- **Sur iPhone / iPad (Safari)** : Cliquez sur le bouton de partage (icône avec flèche vers le haut) puis sur **« Sur l'écran d'accueil »**.
- **Sur PC / Mac (Chrome / Edge)** : Cliquez sur l'icône d'installation dans la barre d'adresse.

### Mode Hors-Ligne (Offline First) :
- En cas de coupure de connexion internet ou réseau cellulaire instable, l'application **continue de fonctionner normalement**.
- Les encaissements, mouvements de stocks et enregistrements de créances sont stockés localement et sécurisés. Dès le rétablissement de la connexion, les données se synchronisent automatiquement avec le Cloud Firestore.

---

## 3. Impression Thermique POS-80 & POS-58 (Bluetooth BLE & ESC/POS)

BizPilot intègre un pilote direct **Web Bluetooth BLE** pour les imprimantes de tickets de caisse sans fil (format 80mm et 58mm).

### Comment imprimer un ticket sur imprimante POS-80 BLE :
1. **Activer le Bluetooth** sur votre téléphone ou tablette.
2. **Allumer l'imprimante thermique** POS-80 / POS-58.
3. À la validation d'une vente sur BizPilot (ou depuis l'historique des ventes) :
   - Cliquez sur le bouton bleu **« POS80 BLE »**.
   - Le navigateur affiche la liste des périphériques Bluetooth détectés.
   - Sélectionnez votre imprimante thermique (ex: *POS80*, *MTP-II*, *RPP02N*).
   - Le ticket est imprimé immédiatement avec découpe automatique du papier et mise en page adaptée.
4. **Autres méthodes de partage** :
   - Bouton **« WhatsApp »** : Génère un ticket formaté prêt à envoyer au client avec détails des articles, remise et total en FCFA.
   - Bouton **« Navigateur »** : Impression standard sur imprimante de bureau ou génération PDF.

---

## 4. Espace d'Administration Plateforme (Super Admin)

Pour la maintenance globale et la supervision :
- **Accès discret** : Effectuer un **triple-clic** rapide sur le logo **BizPilot BF** dans la barre de navigation.
- **Code PIN Maître** : **`761278`**.
- Permet de gérer tous les comptes entreprises, réinitialiser les codes PIN des utilisateurs, surveiller la télémétrie Firestore et exporter des sauvegardes brutes.

---

## 5. Suivi à Distance & Surveillance Temps Réel par le Propriétaire 📡

Les commerçants et gérants de boutiques au Burkina Faso (qu'ils soient en déplacement, à domicile ou à l'étranger) peuvent suivre l'activité de leur magasin en direct via l'onglet **Tableau de Bord > Suivi Live Direct** :

### Fonctionnalités de surveillance en direct :
1. **Flux des Ventes en Temps Réel (Live Stream)** :
   - Chaque encaissement validé par un caissier apparaît instantanément à l'écran avec le numéro de reçu, les articles, le montant en FCFA et le mode de règlement (Espèces, Orange Money, Moov Money, Wave/Coris, Crédit).
   - **Carillon Sonore de Caisse (Bip Live)** : Option pour émettre un bip sonore discret lors de chaque vente reçue.
2. **Indicateurs Clés & Solde Théorique de Caisse** :
   - **Chiffre d'Affaires du Jour en direct**.
   - **Solde Théorique Espèces dans le tiroir-caisse** : `(Ventes Cash + Règlements Dettes Cash) - Dépenses Cash`.
   - **Bénéfice Net Estimé du jour** en direct.
   - **Activité par caissier** (nombre de ventes et total encaissé par collaborateur).
3. **Vigilance & Contrôle des Fraudes à Distance** :
   - Surveillance des remises exceptionnelles accordées par les caissiers.
   - Surveillance des ventes à crédit octroyées.
   - Alertes de ruptures et seuils critiques de stocks.
4. **Rapport Flash WhatsApp en 1 Clic** :
   - Génération instantanée du bilan financier du jour au format WhatsApp prêt à être envoyé ou archivé.
5. **Accès Mobile Dédié via QR Code** :
   - Le propriétaire peut scanner le QR Code affiché dans le tableau de bord pour ouvrir directement le moniteur en direct sur son téléphone portable personnel.

