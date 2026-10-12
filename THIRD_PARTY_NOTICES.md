# Drittanbieterhinweise

Die Anwendung verwendet D3 einschließlich transitiver Laufzeitabhängigkeiten,
KERN UX Native und Fira Sans. Die Projektlizenz ersetzt deren Lizenzen nicht.

| Bestandteil                                    | Lizenz und Nachweis                                                                                                 |
| ---------------------------------------------- | ------------------------------------------------------------------------------------------------------------------- |
| D3 7.9.0 und transitive Laufzeitabhängigkeiten | Versionen und vollständige Texte in [ausgelieferten Drittanbieterhinweisen](public/THIRD-PARTY-NOTICES.txt)         |
| KERN UX Native 2.8.2                           | [EUPL-1.2](public/assets/licenses/KERN-EUPL-1.2.txt), [Quellcode](https://gitlab.opencode.de/kern-ux/kern-ux-plain) |
| Fira Sans                                      | [SIL Open Font License 1.1](public/assets/licenses/Fira-OFL.txt)                                                    |

Bei Dependency-Updates Versionsangaben und ausgelieferte Lizenzhinweise gemeinsam
prüfen und aktualisieren. Build- und Testwerkzeuge werden nicht an Anwender
ausgeliefert; ihre Versionen stehen in `package-lock.json`, ihre Lizenzen in den
installierten Paketen. Die Anwendungslizenz in [LICENSE](LICENSE) bleibt unverändert.

BundesSans ist noch nicht Bestandteil des veröffentlichten Viewers. Eine spätere
Einbindung unterliegt gesonderten Nutzungsbedingungen und wird weder durch die
Projektlizenz noch durch die KERN-Lizenz freigegeben.
