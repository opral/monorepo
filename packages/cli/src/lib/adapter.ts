import { AdapterInterface } from '../../../common/src/adapters';
import { FluentAdapter } from '../../../common/src/adapters/fluentAdapter';
import { SwiftAdapter } from '../../../common/src/adapters/swiftAdapter';
import { Typesafei18nAdapter } from '../../../common/src/adapters/typesafei18nAdapter';
import { Result } from '../../../common/src/types/result';

export function getAdapter(adapter: string): Result<AdapterInterface, Error> {
  if (adapter === 'swift') {
    return Result.ok(new SwiftAdapter());
  } else if (adapter === 'typesafe-i18n') {
    return Result.ok(new Typesafei18nAdapter());
  } else if (adapter === 'fluent') {
    return Result.ok(new FluentAdapter());
  } else {
    return Result.err(Error('Incorrect adapter'));
  }
}
