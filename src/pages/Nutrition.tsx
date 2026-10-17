import { useRef, useState } from 'react';
import {
  AlertCircle,
  Apple,
  CalendarDays,
  Pencil,
  Plus,
  Save,
  Trash2,
  Utensils,
  X,
} from 'lucide-react';
import { dailyNutrients, mealNutrients } from '../domain';
import type { Command, Food, Meal, Nutrients, PageProps } from '../types';

const nutrientFields: [keyof Nutrients, string, string][] = [
  ['calories', 'Energia', 'kcal'],
  ['protein', 'Proteína', 'g'],
  ['carbs', 'Carboidratos', 'g'],
  ['fat', 'Gorduras', 'g'],
];
const mealTypes = ['Café da manhã', 'Almoço', 'Lanche', 'Jantar', 'Ceia', 'Outra refeição'];
const format = (value: number | null) =>
  value === null ? '—' : new Intl.NumberFormat('pt-BR', { maximumFractionDigits: 1 }).format(value);
const blankFood = (): Food => ({
  id: crypto.randomUUID(),
  name: '',
  unit: 'g',
  nutrients: { calories: null, protein: null, carbs: null, fat: null },
});

export default function Nutrition({ state, dispatch, busy, day }: PageProps) {
  const [date, setDate] = useState(day);
  const [tab, setTab] = useState<'diary' | 'foods'>('diary');
  const [food, setFood] = useState<Food | null>(null);
  const [foodId, setFoodId] = useState('');
  const [quantity, setQuantity] = useState('');
  const [mealType, setMealType] = useState('Almoço');
  const [editing, setEditing] = useState<Meal | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const lock = useRef(false);
  const mealId = useRef(crypto.randomUUID());
  const disabled = busy || pending;
  const meals = state.meals.filter((meal) => meal.day === date);
  const summary = dailyNutrients(meals);
  const selectedFood = state.foods.find((item) => item.id === foodId);
  async function execute(command: Command) {
    if (lock.current || busy) return false;
    lock.current = true;
    setPending(true);
    try {
      return await dispatch(command);
    } finally {
      lock.current = false;
      setPending(false);
    }
  }
  return (
    <div className="page-stack">
      <header className="page-heading">
        <div>
          <p className="eyebrow">ENERGIA PARA O SEU DIA</p>
          <h1>Um registro de cada vez.</h1>
          <p>Seu diário de alimentação, sem complicar.</p>
        </div>
        <div className="heading-icon">
          <Apple size={30} />
        </div>
      </header>
      <div className="tabs" aria-label="Áreas de alimentação">
        <button
          className={`tab ${tab === 'diary' ? 'active' : ''}`}
          aria-pressed={tab === 'diary'}
          onClick={() => setTab('diary')}
        >
          Diário alimentar
        </button>
        <button
          className={`tab ${tab === 'foods' ? 'active' : ''}`}
          aria-pressed={tab === 'foods'}
          onClick={() => setTab('foods')}
        >
          Meus alimentos
        </button>
      </div>
      {tab === 'diary' && (
        <>
          <div className="section-title">
            <div>
              <h2>Seu dia no prato</h2>
              <p>
                {meals.length} {meals.length === 1 ? 'registro' : 'registros'} de consumo
              </p>
            </div>
            <label className="date-control">
              <CalendarDays size={18} />
              <span className="sr-only">Data do diário alimentar</span>
              <input
                type="date"
                required
                value={date}
                onChange={(event) => {
                  if (event.target.value) setDate(event.target.value);
                }}
              />
            </label>
          </div>
          <div className="stats-grid nutrient-stats">
            {nutrientFields.map(([key, label, unit]) => (
              <div className="stat-card" key={key}>
                <span>{label}</span>
                <strong>
                  {format(summary.totals[key])}
                  <small>{unit}</small>
                </strong>
                <p>Total registrado</p>
              </div>
            ))}
          </div>
          {summary.incomplete && (
            <p className="notice">
              <AlertCircle size={18} />
              <span>
                Informação nutricional incompleta: os totais incluem somente os valores conhecidos
                dos alimentos registrados.
              </span>
            </p>
          )}
          <section className="card">
            <div className="section-title">
              <div>
                <p className="eyebrow">ADICIONAR AO DIA</p>
                <h2>O que você comeu?</h2>
              </div>
              <Utensils size={23} className="muted" />
            </div>
            {state.foods.length === 0 ? (
              <div className="inline-empty">
                <p>
                  Primeiro, cadastre um alimento com as informações do rótulo ou da sua fonte de
                  referência.
                </p>
                <button
                  className="button primary"
                  onClick={() => {
                    setFood(blankFood());
                    setTab('foods');
                  }}
                >
                  <Plus size={17} />
                  Cadastrar alimento
                </button>
              </div>
            ) : (
              <form
                className="meal-form"
                onSubmit={async (event) => {
                  event.preventDefault();
                  if (
                    await execute({
                      type: 'addMeal',
                      id: mealId.current,
                      day: date,
                      mealType,
                      foodId,
                      quantity: Number(quantity),
                    })
                  ) {
                    mealId.current = crypto.randomUUID();
                    setQuantity('');
                  }
                }}
              >
                <label className="field">
                  <span>Alimento</span>
                  <select required value={foodId} onChange={(e) => setFoodId(e.target.value)}>
                    <option value="">Selecione um alimento</option>
                    {state.foods.map((item) => (
                      <option key={item.id} value={item.id}>
                        {item.name} ({item.unit})
                      </option>
                    ))}
                  </select>
                </label>
                <label className="field">
                  <span>Quantidade ({selectedFood?.unit ?? 'g ou ml'})</span>
                  <input
                    type="number"
                    min="0.1"
                    max="100000"
                    step="any"
                    required
                    value={quantity}
                    onChange={(e) => setQuantity(e.target.value)}
                    placeholder="Ex.: 100"
                  />
                </label>
                <label className="field">
                  <span>Refeição</span>
                  <select value={mealType} onChange={(e) => setMealType(e.target.value)}>
                    {mealTypes.map((type) => (
                      <option key={type}>{type}</option>
                    ))}
                  </select>
                </label>
                <button className="button primary" disabled={disabled || !selectedFood}>
                  <Plus size={18} />
                  Registrar
                </button>
              </form>
            )}
            <p className="muted small">
              O registro usa a unidade do alimento. Não há conversão entre gramas e mililitros.
            </p>
          </section>
          {editing && (
            <form
              className="card editor-card"
              onSubmit={async (event) => {
                event.preventDefault();
                if (
                  await execute({
                    type: 'editMeal',
                    id: editing.id,
                    day: editing.day,
                    mealType: editing.mealType,
                    quantity: editing.quantity,
                  })
                )
                  setEditing(null);
              }}
            >
              <div className="section-title">
                <div>
                  <h2>Editar consumo</h2>
                  <p>{editing.foodName} · informações nutricionais preservadas</p>
                </div>
                <button
                  className="icon-button"
                  type="button"
                  disabled={disabled}
                  aria-label="Fechar edição de consumo"
                  onClick={() => setEditing(null)}
                >
                  <X size={19} />
                </button>
              </div>
              <div className="form-grid three-columns">
                <label className="field">
                  <span>Data</span>
                  <input
                    type="date"
                    required
                    value={editing.day}
                    onChange={(e) => setEditing({ ...editing, day: e.target.value })}
                  />
                </label>
                <label className="field">
                  <span>Quantidade ({editing.unit})</span>
                  <input
                    type="number"
                    min="0.1"
                    max="100000"
                    step="any"
                    required
                    value={editing.quantity || ''}
                    onChange={(e) => setEditing({ ...editing, quantity: Number(e.target.value) })}
                  />
                </label>
                <label className="field">
                  <span>Refeição</span>
                  <select
                    value={editing.mealType}
                    onChange={(e) => setEditing({ ...editing, mealType: e.target.value })}
                  >
                    {[...new Set([...mealTypes, editing.mealType])].map((type) => (
                      <option key={type}>{type}</option>
                    ))}
                  </select>
                </label>
              </div>
              <button className="button primary" disabled={disabled}>
                <Save size={17} />
                Salvar consumo
              </button>
            </form>
          )}
          <div className="section-title">
            <h2>Refeições registradas</h2>
            <span className="muted small">{date.split('-').reverse().join('/')}</span>
          </div>
          {!meals.length ? (
            <div className="empty-state">
              <Utensils size={30} />
              <h3>Uma página em branco</h3>
              <p>Os alimentos registrados nesta data aparecerão aqui.</p>
            </div>
          ) : (
            <div className="page-stack compact">
              {[...new Set(meals.map((meal) => meal.mealType))].map((type) => (
                <section className="card meal-group" key={type}>
                  <h3>
                    <span className="meal-type-dot" />
                    {type}
                  </h3>
                  {meals
                    .filter((meal) => meal.mealType === type)
                    .map((meal) => {
                      const nutrients = mealNutrients(meal);
                      return (
                        <div className="meal-entry" key={meal.id}>
                          <div className="meal-entry-main">
                            <div className="grow">
                              <h3>{meal.foodName}</h3>
                              <p>
                                {format(meal.quantity)} {meal.unit}{' '}
                                <span className="meal-energy">
                                  · {format(nutrients.calories)} kcal
                                </span>
                              </p>
                              <div className="macro-line">
                                <span>P {format(nutrients.protein)} g</span>
                                <span>C {format(nutrients.carbs)} g</span>
                                <span>G {format(nutrients.fat)} g</span>
                              </div>
                            </div>
                            <button
                              className="icon-button"
                              aria-label={`Editar consumo de ${meal.foodName}`}
                              disabled={disabled}
                              onClick={() => {
                                setEditing({ ...meal });
                                setDeleting(null);
                              }}
                            >
                              <Pencil size={17} />
                            </button>
                            <button
                              className="icon-button danger-text"
                              aria-label={`Remover consumo de ${meal.foodName}`}
                              disabled={disabled}
                              onClick={() => setDeleting(meal.id)}
                            >
                              <Trash2 size={17} />
                            </button>
                          </div>
                          {deleting === meal.id && (
                            <div className="delete-confirm" role="alert">
                              <p>Remover este registro de {meal.foodName}?</p>
                              <div className="button-row">
                                <button
                                  className="button danger"
                                  disabled={disabled}
                                  onClick={async () => {
                                    if (await execute({ type: 'deleteMeal', id: meal.id })) {
                                      setDeleting(null);
                                      if (editing?.id === meal.id) setEditing(null);
                                    }
                                  }}
                                >
                                  Sim, remover
                                </button>
                                <button
                                  className="button secondary"
                                  disabled={disabled}
                                  onClick={() => setDeleting(null)}
                                >
                                  Cancelar
                                </button>
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                </section>
              ))}
            </div>
          )}
        </>
      )}
      {tab === 'foods' && (
        <>
          <div className="section-title">
            <div>
              <h2>Sua despensa digital</h2>
              <p>Alimentos cadastrados manualmente, na sua unidade.</p>
            </div>
            <button
              className="button primary"
              disabled={disabled}
              onClick={() => setFood(blankFood())}
            >
              <Plus size={17} />
              Novo alimento
            </button>
          </div>
          {food && (
            <form
              className="card editor-card"
              onSubmit={async (event) => {
                event.preventDefault();
                if (await execute({ type: 'saveFood', food })) setFood(null);
              }}
            >
              <div className="section-title">
                <h2>
                  {state.foods.some((item) => item.id === food.id)
                    ? 'Editar alimento'
                    : 'Novo alimento'}
                </h2>
                <button
                  className="icon-button"
                  type="button"
                  disabled={disabled}
                  aria-label="Fechar edição de alimento"
                  onClick={() => setFood(null)}
                >
                  <X size={19} />
                </button>
              </div>
              <div className="form-grid">
                <label className="field">
                  <span>Nome do alimento</span>
                  <input
                    required
                    maxLength={120}
                    value={food.name}
                    onChange={(e) => setFood({ ...food, name: e.target.value })}
                    placeholder="Ex.: Iogurte natural"
                  />
                </label>
                <label className="field">
                  <span>Unidade de referência</span>
                  <select
                    value={food.unit}
                    onChange={(e) => setFood({ ...food, unit: e.target.value as 'g' | 'ml' })}
                  >
                    <option value="g">Gramas (g)</option>
                    <option value="ml">Mililitros (ml)</option>
                  </select>
                </label>
              </div>
              <div>
                <h3>Informações por 100 {food.unit}</h3>
                <p className="muted small">
                  Deixe em branco o que você não sabe. Zero significa um valor conhecido.
                </p>
              </div>
              <div className="form-grid nutrient-fields">
                {nutrientFields.map(([key, label, unit]) => (
                  <label className="field" key={key}>
                    <span>
                      {label} ({unit})
                    </span>
                    <input
                      type="number"
                      min="0"
                      max="10000"
                      step="any"
                      value={food.nutrients[key] ?? ''}
                      onChange={(e) =>
                        setFood({
                          ...food,
                          nutrients: {
                            ...food.nutrients,
                            [key]: e.target.value === '' ? null : Number(e.target.value),
                          },
                        })
                      }
                      placeholder="Desconhecido"
                    />
                  </label>
                ))}
              </div>
              <p className="notice">
                Alterações no alimento se aplicam a novos registros. O consumo já registrado mantém
                seus valores originais.
              </p>
              <button className="button primary" disabled={disabled}>
                <Save size={17} />
                Salvar alimento
              </button>
            </form>
          )}
          {!state.foods.length ? (
            <div className="empty-state">
              <Apple size={30} />
              <h3>Sua despensa está vazia</h3>
              <p>Cadastre alimentos uma vez e reutilize no seu diário.</p>
            </div>
          ) : (
            <div className="card list-card">
              {state.foods.map((item) => (
                <div className="list-row" key={item.id}>
                  <div className="list-icon">
                    <Apple size={20} />
                  </div>
                  <div className="grow">
                    <h3>{item.name}</h3>
                    <p>
                      {format(item.nutrients.calories)} kcal por 100 {item.unit}
                    </p>
                    <div className="macro-line">
                      <span>P {format(item.nutrients.protein)} g</span>
                      <span>C {format(item.nutrients.carbs)} g</span>
                      <span>G {format(item.nutrients.fat)} g</span>
                    </div>
                  </div>
                  <button
                    className="icon-button"
                    aria-label={`Editar ${item.name}`}
                    disabled={disabled}
                    onClick={() => setFood({ ...item, nutrients: { ...item.nutrients } })}
                  >
                    <Pencil size={18} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
