import json
import os
import sys
import argparse

STATE_FILE = '.context_state.json'

def load_state():
    if not os.path.exists(STATE_FILE):
        return {}
    try:
        with open(STATE_FILE, 'r') as f:
            return json.load(f)
    except json.JSONDecodeError:
        return {}

def save_state(state):
    with open(STATE_FILE, 'w') as f:
        json.dump(state, f, indent=4)

def handle_set(args):
    state = load_state()
    state[args.key] = args.value
    save_state(state)
    print(f"Set '{args.key}' = '{args.value}'")

def handle_get(args):
    state = load_state()
    if args.key in state:
        print(state[args.key])
    else:
        print(f"Key '{args.key}' not found", file=sys.stderr)
        sys.exit(1)

def handle_delete(args):
    state = load_state()
    if args.key in state:
        del state[args.key]
        save_state(state)
        print(f"Deleted '{args.key}'")
    else:
        print(f"Key '{args.key}' not found", file=sys.stderr)
        sys.exit(1)

def handle_list(args):
    state = load_state()
    print(json.dumps(state, indent=4))

def main():
    parser = argparse.ArgumentParser(description="Manage persistent context state.")
    subparsers = parser.add_subparsers(dest="command", required=True)

    # set command
    parser_set = subparsers.add_parser("set", help="Set a key-value pair")
    parser_set.add_argument("key", help="The key to set")
    parser_set.add_argument("value", help="The value to store")
    parser_set.set_defaults(func=handle_set)

    # get command
    parser_get = subparsers.add_parser("get", help="Get a value by key")
    parser_get.add_argument("key", help="The key to retrieve")
    parser_get.set_defaults(func=handle_get)

    # delete command
    parser_delete = subparsers.add_parser("delete", help="Delete a key")
    parser_delete.add_argument("key", help="The key to delete")
    parser_delete.set_defaults(func=handle_delete)

    # list command
    parser_list = subparsers.add_parser("list", help="List all key-value pairs")
    parser_list.set_defaults(func=handle_list)

    args = parser.parse_args()
    args.func(args)

if __name__ == "__main__":
    main()