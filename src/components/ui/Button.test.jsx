import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import Button from "./Button.jsx";

describe("Button", () => {
  it("renderiza el texto que recibe como children", () => {
    render(<Button>Guardar</Button>);
    expect(screen.getByRole("button", { name: "Guardar" })).toBeInTheDocument();
  });

  it("aplica la clase del variant por defecto (primary) cuando no se especifica ninguno", () => {
    render(<Button>Confirmar</Button>);
    expect(screen.getByRole("button")).toHaveClass("ui-btn-primary");
  });

  it("aplica la clase del variant indicado", () => {
    render(<Button variant="danger">Eliminar</Button>);
    expect(screen.getByRole("button")).toHaveClass("ui-btn-danger");
  });

  it('cae a "primary" si recibe un variant que no existe en el sistema de diseño', () => {
    render(<Button variant="no-existe">Algo</Button>);
    expect(screen.getByRole("button")).toHaveClass("ui-btn-primary");
  });

  it("llama a onClick cuando se lo clickea", async () => {
    const handleClick = vi.fn();
    const user = userEvent.setup();
    render(<Button onClick={handleClick}>Click acá</Button>);

    await user.click(screen.getByRole("button", { name: "Click acá" }));

    expect(handleClick).toHaveBeenCalledOnce();
  });

  it("no llama a onClick cuando está disabled", async () => {
    const handleClick = vi.fn();
    const user = userEvent.setup();
    render(
      <Button onClick={handleClick} disabled>
        No clickeable
      </Button>
    );

    await user.click(screen.getByRole("button", { name: "No clickeable" }));

    expect(handleClick).not.toHaveBeenCalled();
  });
});
