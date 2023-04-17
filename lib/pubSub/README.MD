# Todo

- Beschreibung aktualisieren
- Tests für extractPatternForSubscriptions = false

# PubSubSystem

Das Speicher System ist in der Lage, Dict-Nested-Objects zu Speicher (also Objekte die von einem JSON-Format abstammen)
Jedes Element dieses Objektes ist einzel abrufbar über Pointer beispielsweise sei folgendes Objekt gebeben:

Variablen-Name = "Beispiel"

Variablen-Inhalt (Darstellung in JSON):

```json
{
  "a": 1337,
  "b": [1, 3, 3, 7],
  "c": "1337",
  "d": {
    "a_1": "Diesen Wert will ich haben",
    "a_2": "Diesen Wert will ich auch haben"
  }
}
```

Verwendetes Trennzeichen für die Pointer: "/"

Um nun auf die Variablen Felder `a_1` und `a_2` zuzugreifen gibt es nun folgende möglichkeiten:

1. Die Elemente jeweils einzeln abrufen, dabei entstehen folgende Pointer

- `Beispiel/d/a_1`
- `Beispiel/d/a_2`

2. Alternativ kann auch sofort das Objekt abgerufen werden => einzelner Aufruf:

- `Beispiel/d`

Ferner bietet das Speicher-System ein Publish-and-Subscribe Pattern => Subscriber können über
Variableänderungen informiert werden. Dazu geben sie bei der Regristierung ihre benötigte
Callback-Funktion an, sodass ein Aufruf erfolgen kann. Die Benachrichtigungen KÖNNEN asynchron
erfolgen, jedoch werden Kernel intern nur synchrone Subscriptionen verwendet.
